const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: 'dzqhoaddc',
    api_key: '479226886269911',
    api_secret: '0IhRNDMMD94y-Z1-sAB6E2a10lw'
});

function upload(file) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(file, { resource_type: 'auto' }, (err, res) => {
            if (err) {
                console.log('cloudinary err:', err);
                reject(err);
            } else {
                resolve({
                    public_id: res.public_id,
                    secure_url: res.secure_url
                });
            }
        });
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
