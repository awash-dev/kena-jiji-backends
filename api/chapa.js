import axios from "axios";
export default async function handler(req, res) {
    const { amount, currency, email, first_name, last_name, phone_number, tx_ref, callback_url, return_url, customization } = req.body;
    try {

        const header = {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json"
            },

        };
        const body = {
            amount: amount,
            currency: currency,
            email: email,
            first_name: first_name,
            last_name: last_name,
            phone_number: phone_number,
            tx_ref: tx_ref,
            callback_url: callback_url,
            return_url: return_url,
            "customization[title]": customization.title,
            "customization[description]": customization.description
        }
        let resp = "";
        await axios.post("https://api.chapa.co/v1/transaction/initialize", body, header).then(response => {
            resp = response;
        })
            .catch(error => {
                console.log(error.response.data); // Prints the error response data
                console.log(error.response.status); // Prints the status code of the error response
                console.log(error.response.headers); // Prints the headers of the error response
                res.status(400).json({
                    message: error,
                });
            });
        res.status(200).json(resp.data);

    } catch (e) {
        res.status(400).json({
            error_code: e.code,
            message: e.message,
        });
    }
}