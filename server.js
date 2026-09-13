
import express from "express";

const app = express();

app.use(express.json());
app.use(express.static("."));

const TOKEN = process.env.ASTROLOGY_API_TOKEN;

function apiHeaders() {
  return {
    "Content-Type": "application/json",
    "x-astrologyapi-key": TOKEN
  };
}

function parseDob(value) {
  const s = String(value || "").trim();

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [day, month, year] = s.split("/").map(Number);
    return { day, month, year };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [year, month, day] = s.split("-").map(Number);
    return { day, month, year };
  }

  return null;
}

function parseTob(value) {
  const m = String(value || "")
    .trim()
    .match(/^(\d{1,2}):(\d{2})$/);

  if (!m) return null;

  return {
    hour: Number(m[1]),
    min: Number(m[2])
  };
}

app.post("/api/astro-chat", async (req, res) => {
  try {
    if (!TOKEN) {
      return res.status(500).json({
        error: "ASTROLOGY_API_TOKEN missing"
      });
    }

    const { dob, tob, place, question } = req.body || {};

    if (!dob || !tob || !place || !question) {
      return res.status(400).json({
        error: "चारों जानकारी भरें"
      });
    }

    const d = parseDob(dob);
    const t = parseTob(tob);

    if (!d) {
      return res.status(400).json({
        error: "जन्म तारीख DD/MM/YYYY में भरें"
      });
    }

    if (!t) {
      return res.status(400).json({
        error: "जन्म समय HH:MM में भरें"
      });
    }

    const geoResponse = await fetch(
      "https://json.astrologyapi.com/v1/geo_details",
      {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          place: String(place).trim(),
          maxRows: 1
        })
      }
    );

    const geoText = await geoResponse.text();

    let geo;

    try {
      geo = JSON.parse(geoText);
    } catch {
      return res.status(502).json({
        error: "Geo API raw response: " + geoText.slice(0, 500)
      });
    }

    if (!geoResponse.ok || !geo?.geonames?.length) {
      return res.status(502).json({
        error: geo?.message || "Birth city नहीं मिला"
      });
    }

    const location = geo.geonames[0];

    const lat = parseFloat(location.latitude);
    const lon = parseFloat(location.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(502).json({
        error: "Latitude/Longitude नहीं मिला"
      });
    }

    const birthDate =
      String(d.month).padStart(2, "0") +
      "-" +
      String(d.day).padStart(2, "0") +
      "-" +
      d.year;

    const timezoneResponse = await fetch(
      "https://json.astrologyapi.com/v1/timezone_with_dst",
      {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          date: birthDate
        })
      }
    );

    const timezoneText = await timezoneResponse.text();

    let timezoneData;

    try {
      timezoneData = JSON.parse(timezoneText);
    } catch {
      return res.status(502).json({
        error: "Timezone API raw response: " + timezoneText.slice(0, 500)
      });
    }

    if (
      !timezoneResponse.ok ||
      timezoneData?.timezone === undefined
    ) {
      return res.status(502).json({
        error: timezoneData?.message || "Timezone नहीं मिला"
      });
    }

    const chatResponse = await fetch(
      "https://json-chat.astrologyapi.com/api/chat",
      {
        method: "POST",
        headers: apiHeaders(),
        body: JSON.stringify({
          language: "en",
          name: "Customer",
          day: d.day,
          month: d.month,
          year: d.year,
          hour: t.hour,
          min: t.min,
          place:
            location.place_name ||
            location.name ||
            String(place).trim(),lat: String(lat),
          lon: String(lon),
          tzone: String(timezoneData.timezone),
          country: location.country_code || "IN",
          ap: "KUNDLI",
          sid: "",
          ep: "STANDARD",
          ac: "VEDIC",
          q: String(question).trim()
        })
      }
    );

    const chatText = await chatResponse.text();

    let chat;
    try {
      chat = JSON.parse(chatText);
    } catch {
      return res.status(502).json({
        error: "Chat API raw response: " + chatText.slice(0, 700)
      });
    }

    if (!chatResponse.ok) {
      return res.status(502).json({
        error: chat?.message || chat?.error || "Chat API failed"
      });
    }

    return res.json({
      answer: chat?.message || chat?.response?.message || chat?.response || chat
    });

  } catch (error) {
    return res.status(500).json({
      error: error?.message || "Server error"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
        …




  
      

    
