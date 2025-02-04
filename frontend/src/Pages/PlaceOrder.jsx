import React, { useContext, useState, useEffect } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import axios from "axios";


const PlaceOrder = () => {
  const { cartItems, setCartItems, cartItemsChild, setCartItemsChild, books, navigate, backendUrl, token, addToCart, getCartAmount } = useContext(ShopContext);
  const [method, setMethod] = useState("Stripe");
  const [showPickupLocation, setShowPickupLocation] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    country: "",
    phone: "",
  })

  const onChangeHandler = (e) => {
    const name = e.target.name;
    const value = e.target.value;

    setFormData(data => ({...data, [name]: value}));
  }

  const isAddon = (itemId) => itemId.includes('_addon');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      let orderItems = [];
  
      // Process adult cart items
      for(const itemId in cartItems){
        if (cartItems[itemId] > 0) {
          if (isAddon(itemId)) {
            // Handle addon items for adults
            const [parentId, _, addon_id] = itemId.split('_');
            const parentTour = books.find(book => book._id === parentId);
            if (parentTour && parentTour.addons) {
              const addon = parentTour.addons.find(addon => addon._id === addon_id);
              if (addon) {
                orderItems.push({
                  ...addon,
                  name: `${addon.addon_name}`, // Combine parent tour name with addon name
                  price: addon.price,
                  isAddon: true,
                  isChildTicket: false,
                  quantity: cartItems[itemId]
                })
              }
            }
          } else {
            // Handle main tour items for adults
            const itemInfo = books.find((book)=> book._id === itemId);
            if (itemInfo) {
              orderItems.push({
                ...itemInfo,
                isChildTicket: false,
                isAddon: false,
                quantity: cartItems[itemId]
              })
            }
          }
        }
      }
  
      // Process child cart items
      for(const itemId in cartItemsChild){
        if (cartItemsChild[itemId] > 0) {
          if (isAddon(itemId)) {
            // Handle addon items for children
            const [parentId, _, addon_id] = itemId.split('_');
            const parentTour = books.find(book => book._id === parentId);
            if (parentTour && parentTour.addons) {
              const addon = parentTour.addons.find(addon => addon._id === addon_id);
              if (addon) {
                orderItems.push({
                  ...addon,
                  name: `${addon.addon_name}`, // Combine parent tour name with addon name
                  price: addon.kidprice,
                  isAddon: true,
                  isChildTicket: true,
                  quantity: cartItemsChild[itemId]
                })
              }
            }
          } else {
            // Handle main tour items for children
            const itemInfo = books.find((book)=> book._id === itemId);
            if (itemInfo) {
              orderItems.push({
                ...itemInfo,
                price: itemInfo.kidprice,
                isChildTicket: true,
                isAddon: false,
                quantity: cartItemsChild[itemId]
              })
            }
          }
        }
      }
  
      let orderData = {
        address: formData,
        items: orderItems,
        amount: getCartAmount(),
      }
  
      switch (method) {
        case 'stripe':
          const response = await axios.post(backendUrl + '/api/order/stripe', orderData, {headers: {token}})
          if (response.data.success) {
            const {session_url} = response.data
            window.location.replace(session_url)
          } else {
            toast.error(response.data.message);
          }
          break;
        default:
          break;
      }
  
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "An error occurred");
    }
  }

  // Helper function to find item details from books and their addons
  const findItemDetails = (itemId) => {
    // Check if it's an addon
    if (itemId.includes('_addon_')) {
      const [parentId, _, addonId] = itemId.split('_');
      const parentBook = books.find(book => book._id === parentId);
      if (parentBook?.addons) {
        const addon = parentBook.addons.find(addon => addon._id === addonId);
        if (addon) {
          // Return addon with pickup status inherited from parent
          return {
            ...addon,
            pickup: parentBook.pickup // Inherit pickup status from parent
          };
        }
      }
    }
    
    // Look for main item
    const mainItem = books.find(book => book._id === itemId);
    if (mainItem) return mainItem;
    
    return null;
  };

  // Function to check if we have any items with pickup: false
  const hasPickupFalse = () => {
    const allCartItems = [...Object.keys(cartItems), ...Object.keys(cartItemsChild)];
    
    // Only check items that have a quantity greater than 0
    const activeItems = allCartItems.filter(id => 
      (cartItems[id] && cartItems[id] > 0) || (cartItemsChild[id] && cartItemsChild[id] > 0)
    );
  
    return activeItems.some((itemId) => {
      const itemDetails = findItemDetails(itemId);
      return itemDetails?.pickup === false;
    });
  };

  // Update showPickupLocation whenever cart items change
  useEffect(() => {
    setShowPickupLocation(!hasPickupFalse());
  }, [cartItems, cartItemsChild, books]);

  return (
    <section className="max-padd-container">
      <form onSubmit={onSubmitHandler} className="pt-28">
        <div className="flex flex-col xl:flex-row gap-20 xl:gap-28">
          {/* Left Side */}
          <div className="flex flex-1 flex-col gap-3 text-[95%]">
            <Title title1={"Tour "} title2={"Information"} title1Styles={"h3"} />
            <p>Traveler Information:</p>
            <div className="flex gap-3">
              <input
              onChange={onChangeHandler} value={formData.firstName}
                type="text"
                name="firstName"
                placeholder="First Name"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none w-1/2"
                required
              />
              <input
              onChange={onChangeHandler} value={formData.lastName}
                type="text"
                name="lastName"
                placeholder="Last Name"
                className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none w-1/2"
                required
              />
            </div>
            <input
            onChange={onChangeHandler} value={formData.email}
              type="email"
              name="email"
              placeholder="Email"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none"
              required
            />
            <input
            onChange={onChangeHandler} value={formData.phone}
              type="number"
              name="phone"
              placeholder="Phone Number"
              className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none"
              required
            />
            <br />
            {showPickupLocation && (
              <>
                <p>Pickup Location:</p>
                <div className="flex flex-wrap gap-4">
                  <input
                  onChange={onChangeHandler} value={formData.street}
                    type="text"
                    name="street"
                    placeholder="Your Address"
                    className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none"
                    required
                  />
                  <select
                  onChange={onChangeHandler} value={formData.city}
                    name="city"
                    className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none w-1/2"
                    required
                  >
                    <option value="" disabled>
                      Select City/State
                    </option>
                    <option value="Abu Dhabi">Abu Dhabi</option>
                    <option value="Dubai">Dubai</option>
                    <option value="Sharjah">Sharjah</option>
                    <option value="Umm Al Qaiwain">Umm Al Qaiwain</option>
                    <option value="Fujairah">Fujairah</option>
                    <option value="Ajman">Ajman</option>
                    <option value="Ras Al Khaimah">Ras Al Khaimah</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <select
                  onChange={onChangeHandler} value={formData.country}
                    name="country"
                    className="ring-1 ring-slate-900/15 p-1 pl-3 rounded-sm bg-primary outline-none w-1/2 cursor-not-allowed"
                    disabled
                  >
                    <option value="UAE">UAE</option>
                  </select>
                </div>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex flex-1 flex-col">
            <CartTotal />
            {/* Payment Method */}
            <div className="my-6">
              <h3 className="bold-20 mb-5">
                Payment <span className="text-secondary">Method</span>
              </h3>
              <div className="flex gap-3">
                <div
                  onClick={() => setMethod("stripe")}
                  className={`${
                    method === "stripe" ? "btn-secondary" : "btn-white"
                  } !py-1 text-xs cursor-pointer`}
                >
                  Stripe
                </div>
              </div>
            </div>
            <div>
              <button type="submit" className="btn-secondaryOne">
                Book Tour
              </button>
            </div>
          </div>
        </div>
      </form>
      <Footer />
    </section>
  );
};

export default PlaceOrder;