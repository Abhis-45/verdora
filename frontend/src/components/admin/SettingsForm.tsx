export default function SettingsForm() {
  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Admin Settings</h2>

      {/* Profile Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Profile</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Name</label>
            <input
              type="text"
              placeholder="Admin Name"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Email</label>
            <input
              type="email"
              placeholder="admin@example.com"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Save Profile
          </button>
        </form>
      </div>

      {/* Password Settings */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-700 mb-3">Change Password</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Current Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">New Password</label>
            <input
              type="password"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Update Password
          </button>
        </form>
      </div>

      {/* Site Config Settings */}
      <div>
        <h3 className="text-lg font-medium text-gray-700 mb-3">Site Configuration</h3>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600">Site Title</label>
            <input
              type="text"
              placeholder="Verdora Admin"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600">Support Email</label>
            <input
              type="email"
              placeholder="support@verdora.com"
              className="mt-1 block w-full border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-2 rounded-lg transition"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}