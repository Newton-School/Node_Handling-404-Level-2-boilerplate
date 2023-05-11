const Product = require('../models/Product');


//Make changes to the HandleSyncErrros Function to handle 404 errors
const handleAsyncErrors = (asyncFn) => {
    return (req, res, next) => {
        asyncFn(req, res, next).catch((err) => {
            if (err.name === 'CastError' && err.kind === 'ObjectId') {
                // Handling invalid ObjectId errors
                return res.status(404).json({
                    status: 'Error',
                    message: 'Invalid ID',
                });
            }

            res.status(500).json({
                status: 'Error',
                message: 'Internal Server Error',
                error: err.message,
            });
        });
    };
};


const searchProducts = handleAsyncErrors(async (req, res) => {
    const { page = 1, limit = 10, search, category, sort, minPrice, maxPrice } = req.query;
    const query = {};
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    if (category) {
        query.category = category;
    }
    if (minPrice && maxPrice) {
        query.price = { $gte: minPrice, $lte: maxPrice };
    } else if (minPrice) {
        query.price = { $gte: minPrice };
    } else if (maxPrice) {
        query.price = { $lte: maxPrice };
    }
    const sortOrder = sort === 'asc' ? 'price' : '-price';

    const products = await Product.find(query)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort(sortOrder);
    const count = await Product.countDocuments(query);

    res.status(200).json({
        status: 'success',
        data: {
            count,
            products,
        },
    });
});

const getProductByID = handleAsyncErrors(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        return res.status(404).json({
            status: 'Error',
            message: 'Product Not Found',
        });
    }
    res.status(200).json({
        status: 'success',
        data: {
            product,
        },
    });
});


module.exports = { searchProducts, getProductByID };
