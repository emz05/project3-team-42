/*
- Loads client secret for payment from backend
- Renders form using stripe components
- Stripe redirects user to /pay/:paymentId/success if processed
 */

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { paymentsAPI } from '../../services/api.js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function PayForm({ paymentId }) {
    const stripe = useStripe();
    const elements = useElements();
    const [status, setStatus] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setStatus('processing');

        const result = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/pay/${paymentId}/success`,
            },
        });

        if (result.error) {
            setStatus(result.error.message || 'Payment failed');
        } else {
            setStatus('Processing…');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="pay-form">
            <PaymentElement options={{ layout: 'tabs' }} />
            <button disabled={!stripe || status === 'processing'}>
                Pay
            </button>
            {status && <p>{status}</p>}
        </form>
    );
}

export default function PayPage() {
    const { paymentId } = useParams();
    const [clientSecret, setClientSecret] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const { data } = await paymentsAPI.lookupPayment(paymentId);
                setClientSecret(data.clientSecret);
            } catch (error) {
                setClientSecret(null);
            }
        }
        load();
    }, [paymentId]);

    const options = useMemo(() => ({
        clientSecret,
        appearance: { theme: 'flat' },
    }), [clientSecret]);

    if (clientSecret === null) {
        return <p>Payment not found.</p>;
    }

    if (!clientSecret) {
        return <p>Loading…</p>;
    }

    return (
        <Elements stripe={stripePromise} options={options}>
            <PayForm paymentId={paymentId} />
        </Elements>
    );
}

