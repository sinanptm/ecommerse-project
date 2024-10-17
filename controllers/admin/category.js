const { Product, Category } = require("../../models/productModel");
const { createHexId, isValidObjectId } = require('../../util/validations');
const { sharp, path } = require("../../util/modules");

const laodCatagorie = async (req, res) => {
    try {
        const sort = req.query.sort || 'default';
        const name = req.query.name || ''
        const perPage = 4;
        const page = parseInt(req.query.page) || 1;
        const skip = (page - 1) * perPage;

        let sortQuery = [];

        switch (sort) {
            case 'newness':
                sortQuery = [{ $sort: { createdate: -1 } }];
                break;

            case 'less_products':
                sortQuery = [{ $project: { name: 1, description: 1, items: 1, img: 1, sales: 1, numItems: { $size: "$items" } } }, { $sort: { numItems: 1 } }];
                break;

            case 'most_products':
                sortQuery = [{ $project: { name: 1, description: 1, items: 1, img: 1, sales: 1, numItems: { $size: "$items" } } }, { $sort: { numItems: -1 } }];
                break;


            case 'less_saled':
                sortQuery = [{ $sort: { sales: 1 } }];
                break;

            case 'most_saled':
                sortQuery = [{ $sort: { sales: -1 } }];
                break;

            default:
                break;
        }

        if (name !== '') {
            sortQuery.unshift({ $match: { name: { $regex: name, $options: 'i' } } });
        }


        const categories = await Category.aggregate([
            ...sortQuery,
            { $skip: skip },
            { $limit: perPage }
        ]);

        const count = await Category.countDocuments({ name: { $regex: name, $options: 'i' } });
        const totalPages = Math.ceil(count / perPage);


        res.render("catogories", { categories, totalPages, currentPage: page, count, sort, name });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



// * for adding new catogorie

const addCatagorie = async (req, res) => {
    try {
        const { name, description, type } = req.body;

        const processImage = async (filename) => {
            if (filename) {
                const originalImagePath = path.join(__dirname, '../../public/product_images', filename);
                const resizedPath = path.join(__dirname, '../../public/resized_images', filename);
                await sharp(originalImagePath)
                    .resize({ height: 1486, width: 1200, fit: 'fill' })
                    .toFile(resizedPath);
                return filename;
            } else {
                return null;
            }
        };

        const img = await processImage(req.file.filename);

        const newCategory = new Category({
            name,
            description,
            img: img,
            type,
            createdate: Date.now()
        });

        const category = await newCategory.save();
        res.redirect("/admin/catogories");
    } catch (error) {
        console.error("Error adding category:", error);
        console.log("error", "Internal Server Error. Please try again later.");
        res.redirect("/admin/catogories");
    }
};

// * for editting the catogory
const editCatogory = async (req, res) => {
    try {
        const { name, description, type } = req.body;
        const id = req.params.id;

        const existingCatogory = await Category.findById(id);
        const file = req.file && req.file.filename;

        var processImage = async (file) => {
            if (file) {
                const originalImagePath = path.join(__dirname, '../../public/product_images', file);
                const resizedPath = path.join(__dirname, '../../public/resized_images', file);
                await sharp(originalImagePath)
                    .resize({ height: 1486, width: 1200, fit: 'fill' })
                    .toFile(resizedPath);
                return file;
            } else {
                return null;
            }
        };

        if (file) {
            img = await processImage(req.file.filename)
        } else {
            img = existingCatogory.img;
        }


        const category = await Category.updateOne(
            { _id: id },
            {
                $set: {
                    name,
                    description,
                    img,
                    type,
                }
            }
        );

        if (!category) {
            console.log("error", "Failed to update catogory details.");
        }

        res.redirect("/admin/catogories");
    } catch (error) {
        console.error("Error editing catogory:", error);
        console.log("error", "Internal Server Error. Please try again later.");
        res.redirect("/admin/catogories");
    }
};

// * Delte catogotie

const deleteCatogory = async (req, res) => {
    try {
        const id = req.params.id;
        await Category.deleteOne({ _id: id });
        res.redirect("/admin/catogories");
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).send("Internal Server Error");
    }
};


module.exports = {
    laodCatagorie,
    deleteCatogory,
    addCatagorie,
    editCatogory
}