export default function DeactivatedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Account Deactivated
        </h1>
        <p className="text-gray-600 text-sm">
          Your account has been deactivated. Please contact your administrator
          to reactivate it.
        </p>
        <p className="text-gray-400 text-xs mt-4">
          Tu cuenta ha sido desactivada. Contacta a tu administrador para
          reactivarla.
        </p>
      </div>
    </div>
  );
}
