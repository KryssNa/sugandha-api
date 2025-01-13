import mongoose, { Document, Schema } from 'mongoose';

export interface OrderItem {
    product: mongoose.Types.ObjectId;
    name: string;
    image: string;
    price: number;
    quantity: number;
}

const generateOrderNumber = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}

export interface OrderDocument extends Document {
    orderNumber: string;
    user?: mongoose.Types.ObjectId;
    guestEmail?: string;
    items: OrderItem[];
    shippingAddress: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        street: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    paymentMethod: 'credit-card' | 'khalti' | 'esewa' | 'cash-on-delivery';
    payment?: mongoose.Types.ObjectId;
    totalAmount: number;
    subtotal: number;
    tax: number;
    shippingCost: number;
    status: 'pending' | 'processing' | 'paid' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' |'payment-failed';
    isGuest: boolean;
    estimatedDelivery: Date;
}

const orderSchema = new Schema<OrderDocument>({
    orderNumber: {
        type: String,
        unique: true,
        default: () => `ORD-${generateOrderNumber(8)}`
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    guestEmail: {
        type: String,
        sparse: true
    },
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        image: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true,
            min: 0
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    shippingAddress: {
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        country: { type: String, required: true },
        postalCode: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        enum: ['credit-card', 'khalti', 'esewa', 'cash-on-delivery'],
        required: true
    },
    payment: {
        type: Schema.Types.ObjectId,
        ref: 'Payment'
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'paid', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    isGuest: {
        type: Boolean,
        default: false
    },
    estimatedDelivery: {
        type: Date,
        default: () => {
            const deliveryDate = new Date();
            deliveryDate.setDate(deliveryDate.getDate() + 3);
            return deliveryDate;
        }
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export const OrderModel = mongoose.model<OrderDocument>('Order', orderSchema);