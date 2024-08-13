import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useArticles from "../hooks/useArticles";
// Function Component
const ArticleListPage = () => {
  const { articles } = useArticles();
  return (
    <>
      <h1>Articles</h1>
      {
        <>
          {articles &&
            articles.map((article) => (
              <Link
                key={article.name}
                className="article-list-item"
                to={`${article.name}`}
              >
                <h3>{article.name}</h3>
                {article.content && (
                  <p>{article.content[0].substring(0, 150)}...</p>
                )}
              </Link>
            ))}
        </>
      }
    </>
  );
};

export default ArticleListPage;
