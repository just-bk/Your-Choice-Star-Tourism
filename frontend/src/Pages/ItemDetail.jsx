import React, { useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RiAddLine, RiShoppingBag4Line } from "react-icons/ri";
import { ShopContext } from "../context/ShopContext";
import Footer from "../components/Footer";

const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, currency, books } = useContext(ShopContext);
  const [currentImage, setCurrentImage] = useState(null);
  const item = books.find((item) => item._id === id);

  React.useEffect(() => {
    if (item?.image?.[0]) {
      setCurrentImage(item.image[0]);
    }
  }, [item]);

  if (!item) {
    return (
      <section className="mt-36 text-center">
        <h1>Item Not Found</h1>
        <p>We couldn't find the item you're looking for.</p>
      </section>
    );
  }

  const handleBookTour = () => {
    if (item.addquery) {
      // Navigate to HelpCenter with the item name as state
      navigate('/HelpCenter', { state: { productName: item.name } });
    } else {
      addToCart(item._id);
    }
  };

  return (
    <>
      <div className="pt-32 bg-gray-100" id="item-detail">
        <div className="container mx-auto py-8">
          <div className="flex flex-wrap">
            <div className="w-full md:w-1/2 mb-8">
              <div className="w-full h-[28rem] overflow-hidden rounded-2xl flex justify-center items-center">
                <img
                  src={currentImage}
                  alt="Product"
                  className="w-full h-full object-contain rounded-2xl mb-4"
                  id="mainImage"
                />
              </div>
              <div className="flex gap-4 py-4 justify-center overflow-x-auto">
                {item.image?.map((img, index) => (
                  <img
                    key={index}
                    src={img}
                    alt={`Thumbnail ${index + 1}`}
                    className="size-16 sm:size-20 object-cover rounded-md cursor-pointer opacity-60 hover:opacity-100 transition duration-300"
                    onClick={() => setCurrentImage(img)}
                  />
                ))}
              </div>
            </div>

            <div className="w-full md:w-1/2 xl:px-16 xl:py-2">
              <h2 className="text-3xl font-bold mb-2">{item.name}</h2>
              <p className="text-gray-600 mb-4">
                Category: <span className="font-bold">{item.category}</span>
              </p>
              <div className="flex items-center space-x-4 mb-6">
              <button
                  className="flex gap-2 items-center text-white px-6 py-2 rounded-md item-detail-btn"
                  onClick={handleBookTour}
                >
                  {item.addquery ? "Ask Query" : "Add To"} <RiShoppingBag4Line className="text-[20px]" />
                </button>
              </div>
              <div className="mb-4 space-y-2">
                <p className="text-gray-600">
                  Adult:{" "}
                  <span className="font-bold text-black">
                    {item.price} {currency}
                  </span>
                </p>
                <p className="text-gray-600">
                  Child:{" "}
                  <span className="font-bold text-black">
                    {item.kidprice} {currency}
                  </span>
                </p>
              </div>
              <h3 className="text-lg font-semibold mb-2">
                About - <span className="text-secondary">{item.name}:</span>
              </h3>
              <p className="text-gray-700 mb-6">{item.description}</p>
              <div>
                <h3 className="text-lg font-semibold mb-2">What You'll Get:</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {item.expectations?.map((expectation, index) => (
                    <li key={index}>{expectation}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="max-padd-container bg-primary my-20">
        {item.addons?.map((addon, index) => (
          <div className="bg-white p-2 rounded-lg mb-4" key={index}>
            <div className="flex gap-x-3">
              <div className="flex items-start gap-6">
                <img
                  src={addon.image}
                  alt={addon.addon_name}
                  className="h-24 w-24 rounded xxs:hidden sm:block"
                />
              </div>
              <div className="flex flex-col w-full mt-2">
                <p className="font-bold text-black line-clamp-1 w-[18rem]">
                  {addon.addon_name}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <div className="flex items-center ring-1 ring-slate-900/5 rounded-sm overflow-hidden bg-primary mb-3">
                      <p className="px-2">
                        Adult:{" "}
                        <span className="text-black font-bold">
                          {addon.price} {currency}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center ring-1 ring-slate-900/5 rounded-sm overflow-hidden bg-primary">
                      <p className="px-2">
                        Child:{" "}
                        <span className="text-black font-bold">
                          {addon.kidprice} {currency}
                        </span>
                      </p>
                    </div>
                  </div>
                  <button
                    className="flex gap-2 items-center text-white px-2 py-2 rounded-full mr-3 mb-6 item-detail-btn"
                    onClick={() => addToCart(`${item._id}_addon_${addon._id}`)}
                  >
                    <RiShoppingBag4Line className="text-[20px]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="max-padd-container">
        <Footer />
      </section>
    </>
  );
};

export default ItemDetail;
