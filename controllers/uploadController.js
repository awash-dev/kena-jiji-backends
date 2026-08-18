const { upload, deleteImage } = require("../utils/cloudinary");
const vm = require("v-response");

exports.create = async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json(vm.ApiResponse(false, 400, "No file uploaded"));
    }

    const files = req.files;
    console.log(files)
    try {
        // Handle multiple uploads
        const uploadPromises = files.map(file => {
            return upload(file.buffer)
                .then(uploadResult => ({
                    public_id: uploadResult.public_id,
                    secure_url: uploadResult.secure_url
                }))
                .catch(err => {
                    throw err;
                });
        });

        const images = await Promise.all(uploadPromises);
        res.json(images);

    } catch (e) {
        console.log("err:", e);
        return next(e);
    }
};

exports.deleteImage = async (req, res, next) => {
    const { id } = req.params;
    try {
        const result = await deleteImage(id);
        if (result.result === "ok" || result.result === "not found") {
            return res.status(200).json(vm.ApiResponse(true, 200, "Image deleted successfully"));
        } else {
            return res.status(400).json(vm.ApiResponse(false, 400, "Failed to delete image", result));
        }
    } catch (e) {
        console.log("Error deleting image:", e);
        return res.status(500).json(vm.ApiResponse(false, 500, "Server error", e));
    }
};
