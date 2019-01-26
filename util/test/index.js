const AWS = require('aws-sdk')
const fs = require('fs')
const path = require('path')

const {
    CI,
    SCREENSHOT_AWS_S3_BUCKET_ID,
    AWS_S3_ACCESS_KEY_ID,
    AWS_S3_ACCESS_KEY_SECRET
    // @ts-ignore
} = process.env

if (!SCREENSHOT_AWS_S3_BUCKET_ID || !AWS_S3_ACCESS_KEY_ID || !AWS_S3_ACCESS_KEY_SECRET){
    throw new Error('Required environment variables not set: SCREENSHOT_AWS_S3_BUCKET_ID, AWS_S3_ACCESS_KEY_ID, AWS_S3_ACCESS_KEY_SECRET')
}
// configuring the AWS environment
AWS.config.update({
    accessKeyId: AWS_S3_ACCESS_KEY_ID,
    secretAccessKey: AWS_S3_ACCESS_KEY_SECRET
})

const s3 = new AWS.S3()

module.exports.takeScreenshotAndUploadToS3 = async (page,name)=>{

    if (name.indexOf('.png') > -1 || name.indexOf('.jpg') > -1){
        throw new Error('Only specify the name without an extension. This method saves the screenshot as a JPG')
    }

    const filename = name + '.jpg'
    
    const screenshot = await page.screenshot({ type: 'jpeg' })

    const params = {
        Bucket: SCREENSHOT_AWS_S3_BUCKET_ID,
        Body: screenshot,
        Key: Date.now() + '_' + path.basename(filename)
    }

    return new Promise((resolve,reject)=>{
        s3.upload(params, function (err, data) {
            // handle error
            if (err) {
                console.error('S3 Upload Error', err)
                return reject(err)
            }
            
            // success
            if (data && data.Location) {

                if (CI){
                    console.debug('Screenshot saved, URL:',data.Location)
                }
                
                return resolve(data.Location)
            }

            console.error('S3 Upload Unknown Error')
            return reject('S3 Upload Unknown Error')
        })
    })
   
}
