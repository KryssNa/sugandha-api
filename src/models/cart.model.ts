// models/cart.model.ts
import mongoose, { Document, Schema } from 'mongoose';

interface CartItem {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
}

interface CartTotals {
    subtotal: number;
    shipping: number;
    tax: number;
    total: number;
}

export interface CartDocument extends Document {
    user?: mongoose.Types.ObjectId;
    sessionId?: string;
    items: CartItem[];
    couponCode?: string;
    totals: CartTotals;
    expiresAt?: Date;
    updatedAt: Date;
}


const cartSchema = new Schema<CartDocument>({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        sparse: true
    },
    sessionId: {
        type: String,
        sparse: true // Allow null for user carts
    },
    items: [{
        product: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: [1, 'Quantity cannot be less than 1']
        },
        price: {
            type: Number,
            required: true,
            min: [0, 'Price cannot be negative']
        }
    }],
    couponCode: {
        type: String,
        trim: true,
        uppercase: true
    },
    totals: {
        subtotal: {
            type: Number,
            required: true,
            default: 0
        },
        shipping: {
            type: Number,
            required: true,
            default: 0
        },
        tax: {
            type: Number,
            required: true,
            default: 0
        },
        total: {
            type: Number,
            required: true,
            default: 0
        },
        expiresAt: {
            type: Date,
            index: { expires: 0 }
        }
    }
}, {
    timestamps: true
});

// cartSchema.index({ user: 1, sessionId: 1 });

// Pre-save hook to calculate totals
cartSchema.pre('save', async function (next) {
    const cart = this;

    // Calculate subtotal
    cart.totals.subtotal = cart.items.reduce((sum, item) =>
        sum + (item.price * item.quantity), 0
    );

    // Calculate tax (e.g., 10%)
    cart.totals.tax = cart.totals.subtotal * 0.1;

    // Calculate shipping (example logic)
    cart.totals.shipping = cart.totals.subtotal > 1000 ? 0 : 100;

    // Calculate total
    cart.totals.total = cart.totals.subtotal + cart.totals.tax + cart.totals.shipping;

    next();
});

export const CartModel = mongoose.model<CartDocument>('Cart', cartSchema);
