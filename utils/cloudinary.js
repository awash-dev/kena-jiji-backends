const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

function upload(file) {
    return new Promise((resolve, reject) => {
        const finish = (err, res) => {
            if (err) {
                console.log('cloudinary err:', err);
                reject(err);
            } else {
                resolve({
                    public_id: res.public_id,
                    secure_url: res.secure_url
                });
            }
        };
        if (Buffer.isBuffer(file)) {
            const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, finish);
            stream.end(file);
        } else {
            cloudinary.uploader.upload(file, { resource_type: 'auto' }, finish);
        }
    });
}

function deleteImage(publicId) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.destroy(publicId, (err, result) => {
            if (err) {
                console.log('cloudinary delete err:', err);
                reject(err);
            } else {
                console.log('cloudinary delete res:', result);
                resolve(result);
            }
        });
    });
}

module.exports = { upload, deleteImage };
