import { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PostForm = ({ onPostCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    author: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [offlineMode, setOfflineMode] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.title || !formData.content || !formData.author) {
      setError('All fields are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const response = await fetch(`${API_URL}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const newPost = await response.json();
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        author: ''
      });
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated(newPost);
      }
      
      // Reset offline mode if we were successful
      if (offlineMode) {
        setOfflineMode(false);
      }
      
    } catch (err) {
      console.error('Error creating post:', err);
      
      // Check if we're offline
      if (!navigator.onLine || err.message.includes('Failed to fetch')) {
        setOfflineMode(true);
        setError('Database connection unavailable - post will be saved locally');
        
        // Create a temporary post in local storage
        const tempPost = {
          ...formData,
          _id: `temp_${Date.now()}`,
          createdAt: new Date().toISOString(),
          likes: 0
        };
        
        // Save to localStorage
        const savedPosts = JSON.parse(localStorage.getItem('buzznetPosts') || '[]');
        localStorage.setItem('buzznetPosts', JSON.stringify([...savedPosts, tempPost]));
        
        // Reset form
        setFormData({
          title: '',
          content: '',
          author: ''
        });
        
        // Notify parent component
        if (onPostCreated) {
          onPostCreated(tempPost);
        }
      } else {
        setError('Failed to create post');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="post-form-container wide-form">
      <h2>Create New Post</h2>
      
      {error && <div className="error">{error}</div>}
      
      <form className="post-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Write a title for your post..."
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="author">Your Name</label>
          <input
            type="text"
            id="author"
            name="author"
            value={formData.author}
            onChange={handleChange}
            placeholder="Your name"
            disabled={isSubmitting}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Share everything with the BuzzNet community..."
            rows="4"
            disabled={isSubmitting}
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="submit-button"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default PostForm; 