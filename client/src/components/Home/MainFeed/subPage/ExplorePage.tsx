export default function ExplorePage() {
  const exploreItems = [
    {
    id: 1,
    image: "./src/assets/react.svg",
    type: "photo",
  },{
    id: 2,
    image: "./src/assets/hinh-avatar-cute-nu.webp",
    type: "photo",
  },{
    id: 3,
    image: "./src/assets/SpatanWarrior.jpg",
    type: "photo",
  },{
    id: 4,
    image: "./src/assets/romanWarrior.jpg",
    type: "video",
  },{
    id: 5,
    image: "./src/assets/ruaBien.png",
    type: "photo",
  }
]
  
  return (
    <div className="h-screen overflow-y-auto scrollbar-hide">
      <div className="p-4 lg:p-8">
        <h2 className="text-xl font-semibold mb-6">Khám phá</h2>
        <div className="grid grid-cols-3 gap-1">
          {exploreItems.map((item) => (
            <div key={item.id} className="aspect-square bg-gray-100 relative">
              <img
                src={item.image || "/placeholder.svg"}
                alt={`Explore item ${item.id}`}
                className="w-full h-full object-cover"
              />
              {item.type === "video" && (
                <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}