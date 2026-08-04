const express = require("express");
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Test server
app.get("/", (req, res) => {
    res.json({
        status: "success",
        message: "TPTOOL API Online"
    });
});


// Tạo key 24h
app.get("/createkey", async (req, res) => {

    const key =
        "TP-" + Math.random()
        .toString(36)
        .substring(2, 10)
        .toUpperCase();

    const expire = new Date();
    expire.setHours(expire.getHours() + 24);

    const { error } = await supabase
        .from("keys")
        .insert([
            {
                key: key,
                expire: expire.toISOString(),
                device: "",
                vip: "24h"
            }
        ]);

    if (error) {
        return res.json({
            status: "error",
            message: error.message
        });
    }

    res.json({
        status: "success",
        key: key,
        expire: expire
    });

});


// Kiểm tra key
app.get("/checkkey", async (req, res) => {

    const key = req.query.key;
    const device = req.query.device;

    if (!key || !device) {
        return res.json({
            status: "error",
            message: "Thiếu key hoặc device"
        });
    }


    const { data, error } = await supabase
        .from("keys")
        .select("*")
        .eq("key", key)
        .single();


    if (error || !data) {
        return res.json({
            status: "error",
            message: "Key không tồn tại"
        });
    }


    if (new Date(data.expire) < new Date()) {
        return res.json({
            status: "error",
            message: "Key đã hết hạn"
        });
    }


    if (data.device && data.device !== device) {
        return res.json({
            status: "error",
            message: "Key đã dùng trên thiết bị khác"
        });
    }


    if (!data.device) {

        await supabase
            .from("keys")
            .update({
                device: device
            })
            .eq("key", key);

    }


    res.json({
        status: "success",
        message: "Key hợp lệ",
        expire: data.expire,
        vip: data.vip
    });

});


app.listen(PORT, () => {
    console.log("TPTOOL API chạy tại port " + PORT);
});
