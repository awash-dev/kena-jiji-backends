import axios from "axios";
export default async function handler(req, res) {
    const { tnx_ref } = req.body;
    try {

        const header = {
            headers: {
                Authorization: `Bearer ${process.env.CHAPA_SECRET_KEY}`,
                "Content-Type": "application/json"
            },
        };
        let response = await axios.get("https://api.chapa.co/v1/transaction/verify/" + tnx_ref, header)

        let resp = await response.data;
        res.status(200).json({
            message: "Payment successfull",
            status: "success"
        });
    } catch (e) {
        res.status(400).json({
            error_code: e.code,
            message: e.message,
        });
    }
}