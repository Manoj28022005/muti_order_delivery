import React, { useContext, useEffect, useState, useRef } from "react";
import "./PlaceOrder.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const PlaceOrder = () => {
  const navigate = useNavigate();
  const { getTotalCartAmount } = useContext(StoreContext);

  const pickupCoordinates = {
    lat: 21.142843378967736,
    lng: 79.0810480405319,
    address: "Restaurant Location, Nagpur, India",
  };

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    phone: "",
  });

  const [deliveryFee, setDeliveryFee] = useState(null);
  const [totalAmount, setTotalAmount] = useState(getTotalCartAmount());

  const inputRef = useRef(null);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });

  useEffect(() => {
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  loadRazorpayScript().then((res) => {
    if (!res) {
      toast.error("Failed to load Razorpay. Try again.");
    }
  });
}, []);

  useEffect(() => {
    const loadScript = (url, callback) => {
      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.defer = true;
      script.onload = callback;
      document.body.appendChild(script);
    };

    loadScript(
      "https://maps.gomaps.pro/maps/api/js?key=AlzaSyDlBtST40VBXraiF9zeuuhghhUK893JneI&libraries=places",
      () => {
        const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current);
        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            setCoordinates({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });

            setData((prevData) => ({
              ...prevData,
              address: place.formatted_address || "",
            }));
          }
        });
      }
    );
  }, []);

  const handleChange = (e) => {
    setData({ ...data, [e.target.name]: e.target.value });
  };

  const getDeliveryFee = async () => {
    if (!coordinates.lat || !coordinates.lng) {
      toast.error("Please select a valid delivery address.");
      return;
    }

    try {
      const requestData = {
        pickup_details: { lat: pickupCoordinates.lat, lng: pickupCoordinates.lng },
        drop_details: {
          street_address1: data.address,
          lat: coordinates.lat,
          lng: coordinates.lng,
          contact_details: {
            name: `${data.firstName} ${data.lastName}`,
            phone: {
              country_code: "+91",
              number: data.phone,
            },
          },
        },
        customer: {
          name: `${data.firstName} ${data.lastName}`,
          mobile: {
            country_code: "+91",
            number: data.phone,
          },
        },
      };

      const response = await axios.post("http://localhost:4040/api/porter/get_quote", requestData);

      setDeliveryFee(response.data.fare);
      setTotalAmount(getTotalCartAmount() + response.data.fare);
      toast.success(`Delivery Fee: ₹${response.data.fare}`);
    } catch (error) {
      toast.error("Error fetching delivery fee. Please try again.");
      console.error("🚨 Delivery Fee Error:", error.response?.data || error.message);
    }
  };

  const handlePayment = async () => {
    if (!deliveryFee) {
      toast.error("Please calculate the delivery fee before proceeding.");
      return;
    }

    try {
      const paymentResponse = await axios.post("http://localhost:4040/api/porter/checkout", {
        amount: totalAmount * 100, // Convert INR to paise
        currency: "INR",
      });

      const options = {
        key: "YOUR_RAZORPAY_TEST_KEY",
        amount: paymentResponse.data.amount,
        currency: paymentResponse.data.currency,
        order_id: paymentResponse.data.id,
        name: "Ice and Fire Restaurant",
        description: "Food Delivery Payment",
        handler: async function (response) {
          try {
            const orderResponse = await axios.post("http://localhost:4040/api/porter/create_order", {
              request_id: `order_${Date.now()}`,
              pickup_details: { lat: pickupCoordinates.lat, lng: pickupCoordinates.lng },
              drop_details: {
                street_address1: data.address,
                lat: coordinates.lat,
                lng: coordinates.lng,
                contact_details: {
                  name: `${data.firstName} ${data.lastName}`,
                  phone_number: `+91${data.phone}`,
                },
              },
              customer: {
                name: `${data.firstName} ${data.lastName}`,
                mobile: {
                  country_code: "+91",
                  number: data.phone,
                },
              },
            });

            toast.success("Order placed successfully!");
            navigate("/order-confirmation", { state: { orderId: orderResponse.data.order_id } });
          } catch (orderError) {
            toast.error("Order placement failed. Please contact support.");
            console.error("🚨 Order Error:", orderError.response?.data || orderError.message);
          }
        },
        prefill: {
          name: `${data.firstName} ${data.lastName}`,
          email: data.email,
          contact: data.phone,
        },
        theme: { color: "#3399cc" },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      toast.error("Payment initialization failed. Please try again.");
      console.error("🚨 Payment Error:", error.response?.data || error.message);
    }
  };

  return (
    <form className="place-order" onSubmit={(e) => e.preventDefault()}>
      <div className="place-order-left">
        <p className="title">Delivery Information</p>
        <div className="multi-fields">
          <input required name="firstName" value={data.firstName} onChange={handleChange} type="text" placeholder="First name" />
          <input required name="lastName" value={data.lastName} onChange={handleChange} type="text" placeholder="Last name" />
        </div>
        <input required name="email" value={data.email} onChange={handleChange} type="email" placeholder="Email Address" />
        <input ref={inputRef} required name="address" value={data.address} onChange={handleChange} type="text" placeholder="Enter your address" />
        <input required name="phone" value={data.phone} onChange={handleChange} type="text" placeholder="Phone" />
        <button type="button" onClick={getDeliveryFee} className="calculate-fee-btn">
          Calculate Delivery Fee
        </button>
      </div>

      <div className="place-order-right">
        <div className="cart-total">
          <h2>Cart Totals</h2>
          <div>
            <div className="cart-total-details">
              <p>Subtotals</p>
              <p>₹{getTotalCartAmount()}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <p>Delivery Fee</p>
              <p>{deliveryFee !== null ? `₹${deliveryFee}` : "Not calculated"}</p>
            </div>
            <hr />
            <div className="cart-total-details">
              <b>Total</b>
              <b>₹{totalAmount}</b>
            </div>
          </div>
          <button type="button" onClick={handlePayment}>
            PROCEED TO PAYMENT
          </button>
        </div>
      </div>
    </form>
  );
};

export default PlaceOrder;
