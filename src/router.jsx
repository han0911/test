import { createBrowserRouter } from "react-router-dom";
import Error from "./error/error";
import MealPlannerApp from "./components/mainpage"

const router = createBrowserRouter([
  {
    path: "/",
    element: <MealPlannerApp/>,
    errorElement: <Error />,
  }
]);

export default router;