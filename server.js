import express from "express";

const app = express();
app.use(express.json());
app.use(express.static("."));

const TOKEN = process.env.ASTROLOGY_API_TOKEN;

const headers = () => ({
  "Content-Type": "application/json",
  "x-astrologyapi-key": TOKEN
});

app.post("/api/astro-chat", async (req, res) => {
  try {
    if (!TOKEN) {
      return res.status(500).json({ error: "ASTROLOGY_API_TOKEN missing" });
    }

    const { name, gender, dob, tob, place, question } = req.body || {};

    if (!name || !gender || !dob || !tob || !place || !question) {
      return res.status(400).json({ error: "सभी जानकारी भरें" });
    }

    const [year, month, day] = dob.split("-").map(Number);
    const [hour, min] = tob.split(":").map(Number);

    const geoResponse = await fetch(
      "https://json.astrologyapi.com/v1/geo_details",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          place,
          maxRows: 1
        })
      }
    );

    const geo = await geoResponse.json();

    if (!geoResponse.ok || !geo.geonames?.length) {
      return res.status(502).json({ error: "Birth city नहीं मिला" });
    }

    const location = geo.geonames[0];

    const lat = Number(location.latitude);
    const lon = parseFloat(location.longitude);

    const timezoneResponse = await fetch(
      "https://json.astrologyapi.com/v1/timezone_with_dst",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          date:
            
String(month).padStart(2, "0") + "/" +
String(day).padStart(2, "0") + "/" +
String(year)
      })
    }
  );

  const timezoneData = await timezoneResponse.json();
