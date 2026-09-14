import express from "express";

const app = express();
app.use(express.json());

const TOKEN = process.env.ASTROLOGY_API_TOKEN;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/api/test", async (req, res) => {
  try {
    const r = await fetch("https://json-chat.astrologyapi.com/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-astrologyapi-key": TOKEN
      },
      body: JSON.stringify({
        language: "en",
        name: "Test",
        gender: "male",
        day: 1,
        month: 11,
        year: 2005,
        hour: 19,
        min: 45,
        place: "Mumbai",
        lat: "19.17",
        lon: "73.7",
        tzone: "5.5",
        country: "INDIA",
        ap: "KUNDLI",
        sid: "",
        ep: "STANDARD",
        ac: "VEDIC",
        q: "Tell me about my career"
      })
    });

    const text = await r.text();
    res.status(r.status).send(text);
  } catch (e) {
    res.status(500).send(e.message);
  }
});

app.listen(process.env.PORT || 3000);
