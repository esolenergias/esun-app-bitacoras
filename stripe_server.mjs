import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import { chatConSDR } from './sdr_brain.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.use(cors());
app.use(express.json());

// Chat Endpoint SDR (Cerebro IA)
app.post('/api/sdr/chat', async (req, res) => {
  try {
    const { history } = req.body;
    // history expected as: [{role: 'user', parts: [{text: '...'}]}]
    const aiResponseText = await chatConSDR(history);
    res.json({ text: aiResponseText });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1. Checkout para Suscripción (Esol Smart - Recibo Cero)
app.post('/create-subscription-checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Póliza Recibo Cero (Esol Smart)',
              description: 'Suscripción mensual de protección CFE y monitoreo IoT.',
            },
            unit_amount: 39900, // $399.00 MXN (Stripe usa centavos)
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: 'http://localhost:5173/?stripe=success_smart',
      cancel_url: 'http://localhost:5173/?stripe=canceled',
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Checkout para Inversión (Esol Grid)
app.post('/create-investment-checkout', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'mxn',
            product_data: {
              name: 'Inversión Esol Grid (Tokens ESOL-WATT)',
              description: 'Compra de participaciones en proyecto solar comercial.',
            },
            unit_amount: 1000000, // $10,000.00 MXN
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'http://localhost:5173/?stripe=success_grid',
      cancel_url: 'http://localhost:5173/?stripe=canceled',
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 4242;
app.listen(PORT, () => console.log(`Stripe Backend corriendo en el puerto ${PORT}`));
