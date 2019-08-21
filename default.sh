#!/bin/bash -exo pipefail

## Used merge strategy designed by:
## @ref: https://stackoverflow.com/questions/173919/is-there-a-theirs-version-of-git-merge-s-ours/4969679#4969679 Paul Pladijs's answer


echo "Deployment v0.4.0"

export GITHUB_REPO_URL="https://${GITHUB_TOKEN}@github.com/${CIRCLE_PROJECT_USERNAME}/${CIRCLE_PROJECT_REPONAME}.git"


cd ../
mv ./project ./${CIRCLE_PROJECT_REPONAME}
cd ./${CIRCLE_PROJECT_REPONAME}

echo "New working directory:"
pwd




if [ "${CIRCLE_BRANCH}" == "development" ]; then

    echo "Deployment for development not yet implemented..."

elif [ "${CIRCLE_BRANCH}" == "staging" ]; then

    echo "Deployment for staging not yet implemented..."

elif [ "${CIRCLE_BRANCH}" == "production" ]; then

    echo "Deployment for production not yet implemented..."
    
else

    set -exo pipefail

    export TMP_DEV_BRANCH="${CIRCLE_BRANCH}-build-${CIRCLE_BUILD_NUM}"
    export TARGET_BRANCH="development"

    # print current branches
    git branch -a

    # Register repo
    git remote -v
    git remote rm origin
    git remote add origin ${GITHUB_REPO_URL}
    git remote -v

    # Setup and sync target branch
    git checkout ${TARGET_BRANCH} || git checkout -B ${TARGET_BRANCH}
    git reset --hard HEAD
    git fetch origin ${TARGET_BRANCH} || (git push -u origin ${TARGET_BRANCH} && echo "'${TARGET_BRANCH}' branch was created on remote")
    
    # line_count=$(git diff origin/${TARGET_BRANCH}..${CIRCLE_BRANCH} | wc -l)

    # # check if theres changes between target branch and current branch
    # if [ $line_count -gt 0 ]; then
    #     echo "Found ${line_count} line differences between 'origin/${TARGET_BRANCH}' and '${CIRCLE_BRANCH}'. Merging..."


    #     if ! git merge origin/${TARGET_BRANCH} --no-commit; then

    #         gitMergeDiff=$(git diff --diff-filter=U --exit-code --color *)

    #         if [ -n "${SLACK_SERVICE_URL}" ]; then
    #             echo "Sending merge failure message to Slack..."
    #             curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"Merge failed! Run *git checkout ${CIRCLE_BRANCH} && git pull origin ${TARGET_BRANCH}* to see/resolve conflict (${CIRCLE_BUILD_URL})\"}" ${SLACK_SERVICE_URL}
    #         fi #endif SLACK_SERVICE_URL

    #         echo "${gitMergeDiff} \nMerge conflict found. Exiting..."

    #         exit 1
    #     fi #endif hasMergeFailed

    #     # merge remote target branch into current branch
    #     git add .
    #     git commit -am "Merge 'origin/${TARGET_BRANCH}' into local '${TARGET_BRANCH}'" || echo "Nothing to commit"


    # fi
    
    
    
    # make merge commit but without conflicts!!
    # the contents of 'ours' will be discarded later
    git merge -s ours ${CIRCLE_BRANCH}

    # Clone branch being updated with a temporary branch
    echo "Setup temporary branch: '${TMP_DEV_BRANCH}'"
    
    git checkout -B ${TMP_DEV_BRANCH}

    # get contents of working tree and index to the one of CIRCLE_BRANCH
    git reset --hard ${CIRCLE_BRANCH}


    # reset to our merged commit but 
    # keep contents of working tree and index
    git reset --soft ${TMP_DEV_BRANCH}


    # Initialise project
    yarn install --frozen-lockfile --production=false
    yarn build


    # rewrite now.json with env vars (note: this also deletes reserved env vars)
    #node ./node_modules/@etidbury/ts-gql-helpers/util/env-to-now-json.js

    node ./node_modules/@etidbury/ts-gql-helpers/util/prepend-env-vars-build.js

    # Debug now.json
    #cat now.json
    
  

    # Initialise DB
    # yarn db:migrate
    # yarn db:seed

    yarn add @types/jest

    # test new changes
    yarn test:ci

    #ignore pkg changes
    git checkout HEAD -- yarn.lock
    git checkout HEAD -- package.json

    # save new changes to target branch
    git add .
    git commit -am "Merge new build changes from '${CIRCLE_BRANCH}' -> '${TARGET_BRANCH}' (Build ${CIRCLE_BUILD_NUM})" || echo "Nothing to commit"

    # git checkout ${TARGET_BRANCH}
    # git merge ${TMP_DEV_BRANCH}

    git push origin ${TARGET_BRANCH}

    #delete tmp branch (this throws error as TMP_DEV_BRANCH is active branch at this point, 
    #  so dont include unless doing other git stuff later in CI workflow)
    #git branch -d ${TMP_DEV_BRANCH}

fi

#### Deploy via Zeit Now
if [ -z "${NOW_ALIAS}" ] || [ -z "${NOW_TOKEN}" ] || [ -z "${NOW_TEAM}" ]; then
    echo 'Skipping Zeit Now Deploy ( NOW_ALIAS, NOW_TOKEN, NOW_TEAM not set )'        
else

    set -exo pipefail

    # Save all env vars from shell environment to .env file
    printenv | awk '!/PATH=/ && !/HOME=/ && !/HOST=/ && !/CWD=/ && !/PWD=/' > .env

    # re-add deleted env vars
    if [ -z "${MYSQL_HOST}" ];then
        echo "MYSQL_HOST=$MYSQL_HOST" >> .env
    fi

    # Ensure host is set for Zeit
    echo "HOST=0.0.0.0" >> .env

    # Debug env vars
    cat .env




    # rewrite now.json with env vars (note: this also deletes reserved env vars)
    #node ./node_modules/@etidbury/ts-gql-helpers/util/env-to-now-json.js

    # Debug now.json
    #cat now.json

    # Debug files and permissions
    ls -la

    # Debug total size
    du -hs


    #Reset pkgs to reduce size
    # rm -rf node_modules
    # yarn --prod --frozen-lockfile

    # Debug total size after reducing size
    #du -hs


    # Re-initialise project
    yarn install --frozen-lockfile
    yarn build

    node ./node_modules/@etidbury/ts-gql-helpers/util/prepend-env-vars-build.js

    node ./node_modules/@etidbury/ts-gql-helpers/util/update-alias-now-json.js

    echo "Zeit Now Deploying..."


    #export NOW_TEMP_URL=$(now --token "${NOW_TOKEN}" --scope "${NOW_TEAM}")
    # export NOW_TEMP_URL=$(now --token "${NOW_TOKEN}" --scope "${NOW_TEAM}" --target production)

    now --token "${NOW_TOKEN}" --scope "${NOW_TEAM}" --target production
    # if [ -z "${NOW_TEMP_URL}" ]; then
    #     echo "Failed to deploy"
    #     exit 1
    # fi
    # echo "Zeit Now Aliasing '${NOW_TEMP_URL}' to '${NOW_ALIAS}'"

    # now alias "${NOW_TEMP_URL}" "${NOW_ALIAS}" --token "${NOW_TOKEN}" --scope "${NOW_TEAM}"

    # if [ -z "${NOW_SCALE}" ]; then
    #     echo "Skipping scale command (NOW_SCALE not set)"
    # else
    #     echo "Scaling ${NOW_ALIAS} [Min: 1, Max: ${NOW_SCALE}]"
    #     now scale "${NOW_ALIAS}" "1" "${NOW_SCALE}" --token "${NOW_TOKEN}" --scope "${NOW_TEAM}"
    # fi

    if [ -n "${SLACK_SERVICE_URL}" ]; then
        #curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"Deployed ${CIRCLE_PROJECT_REPONAME} at https://${NOW_ALIAS} (${NOW_TEMP_URL})\"}" ${SLACK_SERVICE_URL}
        curl -X POST -H 'Content-type: application/json' --data "{\"text\":\"Deployed ${CIRCLE_PROJECT_REPONAME} at ${NOW_TEMP_URL}\"}" ${SLACK_SERVICE_URL}
    fi
    

fi

