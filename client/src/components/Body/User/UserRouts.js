import { Routes, Route } from "react-router-dom";
import { Home } from "./Home/Home";
import { Header } from "./Header/Header";
import { Footer } from "./Footer/Footer";
import { Profile } from "./Profile/Profile";
import { PagesRoutes } from "./Pages/PageRoutes";
import { PageNotFound } from "../../UI/PageNotFound/PageNotFound";

export const UserRoutes = () => {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="" element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="pages/*" element={<PagesRoutes />} />
          <Route path="*" element={<PageNotFound isAdmin={false} />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
};



