import {
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  HandHeart,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useCartStore } from "../stores/useCartStore";
import Confetti from "react-confetti";
import axios from "../lib/axios";
import type { AxiosError } from "axios";

const PurchaseSuccessPage = () => {
  const [isProcessing, setIsProcessing] = useState<boolean>(true);
  const { clearCart } = useCartStore();
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Get the session ID from the URL search parameters
    const sessionId = new URLSearchParams(window.location.search).get(
      "session_id"
    );
    if (!sessionId) {
      setIsProcessing(false);
      setError("Session ID not found in URL search parameters");
      return;
    }

    const handleCheckoutSuccess = async (sessionId: string) => {
      try {
        const res = await axios.post("/payments/checkout-success", {
          sessionId,
        });
        setOrderId(res.data.orderId);

        clearCart();
      } catch (error) {
        const err = error as AxiosError<{ message?: string }>;
        setError(err.response?.data?.message || "Failed to process payment");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCheckoutSuccess(sessionId);
  }, [clearCart]);

  if (isProcessing) return <LoadingUI />;

  if (error) return <ErrorUI error={error} />;

  return (
    <div className="h-screen flex items-center justify-center px-4">
      <Confetti
        width={window.innerWidth}
        height={window.innerHeight}
        gravity={0.1}
        style={{ zIndex: 99 }}
        numberOfPieces={700}
        recycle={false}
      />

      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl overflow-hidden relative z-10">
        <div className="p-6 sm:p-8">
          <div className="flex justify-center">
            <CheckCircle className="text-emerald-400 w-16 h-16 mb-4" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-center text-emerald-400 mb-2">
            Purchase Successful!
          </h1>

          <p className="text-gray-300 text-center mb-2">
            Thank you for your order. {"We're"} processing it now.
          </p>
          <p className="text-emerald-400 text-center text-sm mb-6">
            Check your email for order details and updates.
          </p>
          <div className="bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Order number</span>
              <span className="text-sm font-semibold text-emerald-400">
                #{orderId}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Estimated delivery</span>
              <span className="text-sm font-semibold text-emerald-400">
                3-5 business days
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-4
             rounded-lg transition duration-300 flex items-center justify-center"
            >
              <HandHeart className="mr-2" size={18} />
              Thanks for trusting us!
            </button>
            <Link
              to={"/"}
              className="w-full bg-gray-700 hover:bg-gray-600 text-emerald-400 font-bold py-2 px-4 
            rounded-lg transition duration-300 flex items-center justify-center"
            >
              Continue Shopping
              <ArrowRight className="ml-2" size={18} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PurchaseSuccessPage;

const LoadingUI = () => {
  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="flex flex-col items-center text-emerald-400 space-y-4">
        <Loader2 className="animate-spin w-10 h-10" />
        <p className="text-lg">Processing your purchase...</p>
      </div>
    </div>
  );
};

const ErrorUI = ({ error }: { error: string }) => {
  return (
    <div className="h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg shadow-xl p-6 sm:p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="text-red-500 w-12 h-12" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-red-500 mb-2">
          Something went wrong
        </h1>
        <p className="text-gray-300 mb-6 break-words">{error}</p>

        <Link
          to={"/"}
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 
            rounded-lg transition duration-300"
        >
          Go Back Home
        </Link>
      </div>
    </div>
  );
};
