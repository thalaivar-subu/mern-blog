import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import NotFound from "./NotFound";
import CommentsList from "../components/CommentsList";
import AddCommentForm from "../components/AddCommentForm";
import useUser from "../hooks/useUser";
import useArticles from "../hooks/useArticles";
// Function Component
const ArticlePage = () => {
  const navigate = useNavigate();
  const { articles, isLoading: articleIsLaoding } = useArticles();
  const [articleInfo, setArticleInfo] = useState({
    articles,
    upvotes: 0,
    comments: [],
    canUpvote: false,
  });
  const { canUpvote } = articleInfo;
  const { articleId } = useParams();
  const { user, isLoading } = useUser();
  useEffect(() => {
    const loadArticleInfo = async () => {
      const token = user && (await user.getIdToken());
      const headers = token ? { authtoken: token } : {};
      const response = await axios.get(`/api/articles/${articleId}`, {
        headers,
      });
      const newArticleInfo = response.data;
      setArticleInfo(newArticleInfo);
    };
    if (!isLoading) {
      loadArticleInfo();
    }
  }, [articleId, isLoading, user]);
  const addUpvote = async () => {
    const token = user && (await user.getIdToken());
    const headers = token ? { authtoken: token } : {};
    const response = await axios.put(
      `/api/articles/${articleId}/upvote`,
      null,
      { headers },
    );
    setArticleInfo(response.data);
  };
  if (!articleIsLaoding) {
    const article = articles.find((article) => article.name === articleId);

    if (!article) return <NotFound />;
    return (
      <>
        <h1>{article.title}</h1>
        <div className="upvotes-section">
          {user ? (
            <button onClick={addUpvote}>
              {canUpvote ? "Upvote" : "Already Upvoted"}
            </button>
          ) : (
            <button
              onClick={() => {
                navigate("/login");
              }}
            >
              Login to Upvote
            </button>
          )}
          <p>This article has {articleInfo.upvotes} upvote(s)</p>
        </div>
        {article.content &&
          article.content.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {user ? (
          <AddCommentForm
            articleName={article.name}
            onArticleUpdated={(updatedArticle) =>
              setArticleInfo(updatedArticle)
            }
          />
        ) : (
          <button
            onClick={() => {
              navigate("/login");
            }}
          >
            Login to Comment
          </button>
        )}
        <CommentsList comments={articleInfo.comments} />
      </>
    );
  }
};

export default ArticlePage;
