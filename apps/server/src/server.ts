import app from './app';

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(`[SERVER] CRAFT SMS Backend v1 running on port ${PORT}`);
});
