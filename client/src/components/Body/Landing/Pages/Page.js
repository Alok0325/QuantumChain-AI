import React from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Layout wrapper for every authed/landing page. The header is fixed at 70 px
 * tall, so we offset content by that much. The migrated pages bring their own
 * gradient backdrop and header card; we just provide the top offset and a
 * subtle ambient gradient.
 */
const Page = () => {
  return (
    <div className="relative w-full min-h-[calc(100vh-70px)] pt-20 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 20%, rgba(110,231,255,0.06) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(184,132,255,0.06) 0%, transparent 50%)',
        }}
      />
      <div className="relative z-10">
        <Outlet />
      </div>
    </div>
  );
};

export default Page;
