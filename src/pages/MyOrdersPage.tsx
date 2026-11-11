import { Package, ChevronRight, Clock, MapPin, Truck, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { useState } from 'react';

export const MyOrdersPage: React.FC = () => {
  const { orders, user, navigateTo, deleteOrder } = useStore();
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  const myOrders = orders.filter(
    (o) => (user && o.phone === user.phone) || (user && o.id.includes('-') && o.id === user.id) // Simple match based on available data
  );

  const confirmDelete = async () => {
    if (deletingOrderId) {
      await deleteOrder(deletingOrderId);
      setDeletingOrderId(null);
    }
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen py-6 sm:py-9">
      <div className="max-w-4xl mx-auto px-4">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6 flex-wrap">
          <button type="button" onClick={() => navigateTo('/')} className="hover:text-[#00A5A8] font-medium">Home</button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          <span className="text-slate-900 font-semibold">My Orders</span>
        </nav>

        <h1 className="text-2xl font-black text-slate-900 mb-6">My Orders</h1>

        {myOrders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center shadow-xs">
            <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 mb-1">No orders found</h3>
            <p className="text-xs text-slate-500 mb-5">You haven't placed any orders yet.</p>
            <button
              type="button"
              onClick={() => navigateTo('/shop')}
              className="px-5 py-2.5 rounded-xl bg-[#00A5A8] text-white text-xs font-bold"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myOrders.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-teal-50 p-3 rounded-xl text-[#00A5A8]">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Order {order.orderNumber}</h4>
                    <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                    <p className="text-xs font-bold text-[#00A5A8] uppercase">{order.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingOrderId(order.id)}
                    className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"
                    title="Delete Order"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo('/track-order', { orderId: order.orderNumber })}
                    className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DeleteConfirmationModal
        isOpen={!!deletingOrderId}
        onClose={() => setDeletingOrderId(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};
