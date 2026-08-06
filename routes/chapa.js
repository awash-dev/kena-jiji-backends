const express = require('express');
const router = express.Router();
const axios = require('axios');

router.post('/initialize', async (req, res) => {
    const {
        amount, totalPrice, currency, email, first_name,
        last_name, phone_number, address, country, city,
        postalCode, tx_ref, callback_url,
        return_url, cart
    } = req.body;

    try {
        const header = {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        };

        const body = {
            amount: amount,
            totalPrice: totalPrice,
            currency: currency,
            email: email,
            first_name: first_name,
            last_name: last_name,
            phone_number: phone_number,
            tx_ref: tx_ref,
            callback_url: callback_url,
            return_url: return_url,
            cart: cart,
            city: city,
            country: country,
            address: address,
            postalCode: postalCode,
        };

        const response = await axios.post("https://api.chapa.co/v1/transaction/initialize", body, header);
        res.status(200).json(response.data);

    } catch (error) {
        console.log(error);
        res.status(400).json({
            message: error,
        });
    }
});

router.post('/verify', async (req, res) => {
    const { tx_ref } = req.body;
    console.log("🚀 ~ router.post ~ tx_ref:", tx_ref)

    try {
        const header = {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json",
            },
        };

        const response = await axios.get("https://api.chapa.co/v1/transaction/verify/" + tx_ref, header);
        let resp = await response.data;
        res.status(200).json({
            message: "Payment successful",
            status: "success",
        });


    } catch (error) {
        console.log(error);
        res.status(400).json({
            error_code: error.code,
            message: error.message,
        });
    }
});

module.exports = router;
