const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen px-4 pt-24 pb-8 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
