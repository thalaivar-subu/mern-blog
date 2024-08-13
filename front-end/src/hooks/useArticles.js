import { useEffect, useState } from "react";
import axios from "axios";
const useArticles = () => {
  const [articles, setArticles] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const getArticles = async () => {
      const response = await axios.get(`/api/articles`);
      console.log("Subu")
      setArticles(response.data);
      setIsLoading(false);
    };
    getArticles();
  }, []);
  return { articles, isLoading };
};

export default useArticles;
