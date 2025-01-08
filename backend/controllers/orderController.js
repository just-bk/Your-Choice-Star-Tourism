import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';
import Stripe from 'stripe';

// Global variables for payement
const currency = 'AED';

// Stripe gateway initialization
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Place order using stripe
// orderController.js
const placeOrderStripe = async (req, res) => {
    try {
        const { userId, items, amount, address } = req.body
        const {origin} = req.headers

        // First create the order
        const orderData = {
            userId,
            items,
            amount,
            address,
            paymentMethod: 'stripe',
            payment: false,
            date: Date.now(),
        }
        const newOrder = new orderModel(orderData)
        await newOrder.save()

        // Then create Stripe session with orderId in success URL
        const line_items = items.map((item) => ({
            price_data: {
                currency: currency,
                product_data: {
                    name: item.isAddon 
                        ? `${item.name} ${item.isChildTicket ? '(Child)' : '(Adult)'}` 
                        : `${item.name} ${item.isChildTicket ? '(Child)' : '(Adult)'}`
                },
                unit_amount: item.price * 100
            },
            quantity: item.quantity
        }))

        const session = await stripe.checkout.sessions.create({
            line_items,
            success_url: `${origin}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url: `${origin}/verify?success=false&orderId=${newOrder._id}`,
            mode: 'payment',
            payment_method_types: ['card'],
        })

        if (session) {
            res.json({
                success: true, 
                session_url: session.url,
                orderId: newOrder._id
            })
        } else {
            // Clean up the order if session creation fails
            await orderModel.findByIdAndDelete(newOrder._id)
            res.json({
                success: false, 
                message: 'Failed to create payment session'
            })
        }
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

const verifyStripe = async (req, res) => {
    const {orderId, success} = req.body;
    console.log('Verification params:', { orderId, success });

    try {
        const order = await orderModel.findById(orderId);
        
        if (!order) {
            console.log('Order not found:', orderId);
            return res.json({
                success: false, 
                message: 'Order not found'
            });
        }

        const isSuccessful = success === 'true' || success === true;
        console.log('Payment success status:', isSuccessful);

        if (isSuccessful) {
            const updatedOrder = await orderModel.findByIdAndUpdate(
                orderId,
                { 
                    payment: true,
                    status: 'Order Placed'
                },
                { new: true }
            );

            console.log('Updated order:', updatedOrder);

            await userModel.findByIdAndUpdate(
                order.userId,
                { cartData: {} }
            );
            
            return res.json({ success: true });
        } else {
            await orderModel.findByIdAndDelete(orderId);
            return res.json({
                success: false,
                message: 'Payment was not completed'
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        return res.json({
            success: false, 
            message: error.message
        });
    }
}

// all orders data for admin panel
const allOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({})
        res.json({success: true, orders})
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// all orders data for frontend
const userOrders = async (req, res) => {
    try {
        const {userId} = req.body;
        const orders = await orderModel.find({
            userId,
            payment: true // Only return paid orders
        })
        res.json({success: true, orders});
    } catch (error) {
        console.log(error);
        res.json({success: false, message: error.message});
    }
}

// Updating order status for Admin Panel
const UpdateStatus = async (req, res) => {
    try {
        const { orderId, status } = req.body;
        await orderModel.findByIdAndUpdate(orderId, { status });
        res.json({ success: true, message: 'Status Updated' });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {placeOrderStripe, verifyStripe, allOrders, userOrders, UpdateStatus}