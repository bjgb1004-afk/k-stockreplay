import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Search, Plus, Edit3, Trash2, Calendar, Eye, User, 
  ChevronLeft, ChevronRight, Hash, ArrowLeft, Sparkles, FileText, 
  HelpCircle, Megaphone, Check, AlertCircle, Share2, Award, ExternalLink
} from 'lucide-react';

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: 'blog' | 'guide' | 'faq' | 'notice';
  tags: string[];
  createdAt: string;
  author: string;
  views: number;
  slug: string;
}

interface BlogCenterProps {
  isAdmin?: boolean;
}

export const BlogCenter: React.FC<BlogCenterProps> = ({ isAdmin = true }) => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'blog' | 'guide' | 'faq' | 'notice'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const postsPerPage = 6;

  // Active Post Detail
  const [activePost, setActivePost] = useState<BlogPost | null>(null);

  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formCategory, setFormCategory] = useState<'blog' | 'guide' | 'faq' | 'notice'>('blog');
  const [formAuthor, setFormAuthor] = useState('수석 애널리스트');
  const [formTags, setFormTags] = useState('');
  const [formSlug, setFormSlug] = useState('');
  
  // UI Messages
  const [uiMessage, setUiMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAdminBypass, setShowAdminBypass] = useState(false);
  const [adminToken, setAdminToken] = useState('ADMIN'); // local simulation token

  // Fetch all posts from the API
  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/posts');
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      } else {
        console.error('Failed to fetch posts');
      }
    } catch (err) {
      console.error('Error fetching posts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Increment view count when opening post
  const handleOpenPost = async (post: BlogPost) => {
    setActivePost(post);
    // Optimistic view increment
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, views: p.views + 1 } : p));
    
    try {
      await fetch(`/api/posts/view/${post.id}`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to increment views on server', e);
    }
  };

  // Filter posts based on category and search query
  const filteredPosts = posts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination bounds
  const totalPages = Math.ceil(filteredPosts.length / postsPerPage);
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;
  const currentPosts = filteredPosts.slice(indexOfFirstPost, indexOfLastPost);

  // Trigger UI message helper
  const triggerMsg = (type: 'success' | 'error', text: string) => {
    setUiMessage({ type, text });
    setTimeout(() => setUiMessage(null), 4000);
  };

  // Reset form helper
  const resetForm = () => {
    setFormTitle('');
    setFormContent('');
    setFormCategory('blog');
    setFormAuthor('수석 애널리스트');
    setFormTags('');
    setFormSlug('');
    setEditId(null);
    setIsEditing(false);
  };

  // Open editor for new post
  const handleCreateNew = () => {
    resetForm();
    setIsEditing(true);
    setActivePost(null);
  };

  // Open editor with prefilled post data
  const handleEditClick = (post: BlogPost) => {
    setEditId(post.id);
    setFormTitle(post.title);
    setFormContent(post.content);
    setFormCategory(post.category);
    setFormAuthor(post.author);
    setFormTags(post.tags.join(', '));
    setFormSlug(post.slug);
    setIsEditing(true);
    setActivePost(null);
  };

  // Handle Post Save (Create / Update)
  const handleSavePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formContent.trim()) {
      triggerMsg('error', '제목과 내용을 모두 작성해주세요.');
      return;
    }

    const computedSlug = formSlug.trim() || formTitle.trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s]/g, '')
      .replace(/\s+/g, '-');

    const tagsArray = formTags.split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const postPayload = {
      title: formTitle,
      content: formContent,
      category: formCategory,
      author: formAuthor,
      tags: tagsArray,
      slug: computedSlug
    };

    try {
      const url = editId ? `/api/posts/${editId}` : '/api/posts';
      const method = editId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postPayload)
      });

      if (res.ok) {
        triggerMsg('success', editId ? '게시글이 성공적으로 수정되었습니다.' : '새로운 게시글이 정상적으로 등록되었습니다.');
        resetForm();
        await fetchPosts();
      } else {
        const errData = await res.json();
        triggerMsg('error', errData.error || '게시글 저장에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      triggerMsg('error', '서버 통신 중 오류가 발생했습니다.');
    }
  };

  // Handle Post Delete
  const handleDeletePost = async (id: string) => {
    if (!window.confirm('정말로 이 게시글을 삭제하시겠습니까? 복구할 수 없습니다.')) {
      return;
    }

    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        triggerMsg('success', '게시글이 안전하게 삭제되었습니다.');
        resetForm();
        setActivePost(null);
        await fetchPosts();
      } else {
        triggerMsg('error', '게시글 삭제에 실패했습니다.');
      }
    } catch (err) {
      console.error(err);
      triggerMsg('error', '삭제 처리 도중 장애가 발생했습니다.');
    }
  };

  // Share Article Function
  const handleShare = (post: BlogPost) => {
    const textToCopy = `[K-Stock Replay] ${post.title}\n바로가기: ${window.location.origin}/blog/${post.slug}`;
    navigator.clipboard.writeText(textToCopy);
    triggerMsg('success', '공유용 기사 주소 복사 완료!');
  };

  const getCategoryBadge = (cat: 'blog' | 'guide' | 'faq' | 'notice') => {
    switch (cat) {
      case 'blog':
        return <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full">블로그</span>;
      case 'guide':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full">블로그 사용법</span>;
      case 'faq':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full">FAQ</span>;
      case 'notice':
        return <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-black px-2.5 py-0.5 rounded-full">공지사항</span>;
    }
  };

  return (
    <div className="col-span-12 space-y-6">
      {/* Blog Center Hero Banner with Google AdSense Optimization */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 pointer-events-none" />
        <div className="space-y-1.5 z-10">
          <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-indigo-400" />
            <span>지식 공유 발전소 & 공식 채널</span>
          </h2>
          <p className="text-xs text-slate-400 max-w-xl font-sans">
            트레이더들의 주도주 공략 바이블, 시뮬레이터 사용 노하우, 자주 묻는 질문(FAQ) 및 최신 소식을 전해드립니다.
          </p>
        </div>
      </div>



      {/* Dynamic Notifications */}
      {uiMessage && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          uiMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          {uiMessage.type === 'success' ? <Check className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-xs font-bold">{uiMessage.text}</span>
        </div>
      )}

      {/* EDITOR SECTION */}
      {isEditing && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-black text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
            <Edit3 className="w-4 h-4 text-indigo-400" />
            <span>{editId ? '게시글 수정하기' : '새 게시글 작성하기'}</span>
          </h3>

          <form onSubmit={handleSavePost} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">게시글 제목</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  placeholder="예: 주도주 첫 분봉 거래량 돌파 전략 가이드"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">카테고리</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 h-[36px]"
                >
                  <option value="blog">블로그</option>
                  <option value="guide">블로그 사용법</option>
                  <option value="faq">FAQ</option>
                  <option value="notice">공지사항</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">작성자 명</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">SEO 친화적 주소명 (Slug) - 미기입시 자동 생성</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
                  placeholder="예: trading-strategy-guide"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 block">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                  placeholder="주식, 주도주, 복기, 차트"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 block">본문 내용 (단락은 줄바꿈으로 자동 구분됩니다)</label>
              <textarea
                required
                rows={12}
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3.5 text-xs text-slate-200 font-sans leading-relaxed focus:outline-none focus:border-indigo-500 custom-scrollbar"
                placeholder="정보성 가치를 극대화하여 애드센스 승인 확률을 높일 수 있는 디테일한 텍스트를 구성하세요."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg transition-all cursor-pointer"
              >
                작성 취소
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>저장 및 게시</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MAIN VIEW: Post Details OR List Grid */}
      {activePost ? (
        /* ================== DETAILED POST VIEW ================== */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Main Article Content */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-7 space-y-5">
              <button
                onClick={() => setActivePost(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>목록으로 돌아가기</span>
              </button>

              <div className="space-y-3.5 border-b border-slate-850 pb-5">
                <div className="flex items-center gap-2 flex-wrap">
                  {getCategoryBadge(activePost.category)}
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(activePost.createdAt).toLocaleDateString()}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    조회수 {activePost.views}회
                  </span>
                </div>
                
                <h1 className="text-lg md:text-2xl font-black text-slate-100 leading-tight">
                  {activePost.title}
                </h1>

                <div className="flex items-center justify-between pt-1 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                    </div>
                    <span className="text-xs font-bold text-slate-300">{activePost.author}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleShare(activePost)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-300 text-[10px] font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1"
                      title="주소 복사"
                    >
                      <Share2 className="w-3 h-3 text-slate-400" />
                      <span>공유</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Injected Google AdSense Top Banner */}
              <div className="h-[90px] w-full" />

              {/* Dynamic content sections separated by paragraphs */}
              <div className="text-sm text-slate-300 font-sans leading-relaxed space-y-4 whitespace-pre-wrap">
                {activePost.content}
              </div>

              {/* Tags block */}
              {activePost.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-4 border-t border-slate-850">
                  {activePost.tags.map((tag, idx) => (
                    <span key={idx} className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-850 flex items-center gap-0.5">
                      <Hash className="w-3 h-3 text-slate-500" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Injected Google AdSense Related Matching Banner */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2.5 text-indigo-400">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black">독자를 위한 추천 정보 (AdSense Multi-Grid)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { title: "오늘 장전에 꼭 봐야할 HBM 핵심 밸류체인 수혜주 대공개", author: "인공지능 연구소" },
                  { title: "초보 트레이더가 가장 많이 실수하는 주도주 매매 손절 타점 5가지", author: "실전투자 멘토" },
                  { title: "K-Stock Replay 명예의 전당 랭커들이 공유하는 실전 복기 방법", author: "운영팀" }
                ].map((rec, idx) => (
                  <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col justify-between hover:border-slate-700 transition-all cursor-pointer min-h-[90px]">
                    <span className="text-[11px] font-extrabold text-slate-300 line-clamp-2 leading-snug">{rec.title}</span>
                    <span className="text-[9px] text-slate-500 mt-2 block">{rec.author}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Quick Navigation & Ad Slot */}
          <div className="lg:col-span-4 space-y-5">
            {/* Category Quick Selector */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                <span>지식 카테고리 정보</span>
              </h3>
              <div className="space-y-2">
                {[
                  { id: 'blog', name: '📈 블로그', count: posts.filter(p => p.category === 'blog').length },
                  { id: 'guide', name: '📖 블로그 사용법', count: posts.filter(p => p.category === 'guide').length },
                  { id: 'faq', name: '❓ FAQ (자주 묻는 질문)', count: posts.filter(p => p.category === 'faq').length },
                  { id: 'notice', name: '📢 공지사항', count: posts.filter(p => p.category === 'notice').length },
                ].map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedCategory(cat.id as any);
                      setActivePost(null);
                    }}
                    className="w-full text-left bg-slate-950 hover:bg-slate-850 p-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex justify-between items-center transition-all cursor-pointer border border-slate-850"
                  >
                    <span>{cat.name}</span>
                    <span className="bg-slate-900 text-slate-500 px-2 py-0.5 rounded font-mono text-[10px] border border-slate-850">{cat.count}개</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Google AdSense Large Rectangle Sidebar Ad Slot */}
            <div className="min-h-[300px] w-full" />
          </div>
        </div>
      ) : (
        /* ================== BLOG POST LIST VIEW ================== */
        <div className="space-y-4">
          {/* Filters, Categories & Search Row */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3.5">
            {/* Category selection pill buttons */}
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'all', name: '전체 소식' },
                { id: 'blog', name: '블로그' },
                { id: 'guide', name: '블로그 사용법' },
                { id: 'faq', name: 'FAQ' },
                { id: 'notice', name: '공지사항' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id as any); setCurrentPage(1); }}
                  className={`px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer border ${
                    selectedCategory === cat.id
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-500/20'
                      : 'bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Search inputs */}
            <div className="relative md:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-950 border border-slate-850 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-500 focus:bg-slate-950 transition-all"
                placeholder="검색어를 입력하세요 (제목, 내용, 태그)..."
              />
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>



          {/* Posts Grid Layout */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
              <p className="text-xs text-slate-400 font-mono">블로그 데이터 로딩 중...</p>
            </div>
          ) : currentPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <HelpCircle className="w-12 h-12 text-slate-600 animate-bounce" />
              <p className="text-xs text-slate-400">해당하는 조건의 콘텐츠가 아직 등록되지 않았습니다.</p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
              >
                필터 초기화
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => handleOpenPost(post)}
                  className="bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-5 hover:bg-slate-900 transition-all duration-300 flex flex-col justify-between cursor-pointer group shadow-sm hover:shadow-indigo-950/20"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {getCategoryBadge(post.category)}
                      <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-black text-slate-200 group-hover:text-indigo-300 transition-colors line-clamp-1 leading-snug">
                      {post.title}
                    </h3>

                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-sans">
                      {post.content.replace(/[#*`_]/g, '')}
                    </p>
                  </div>

                  <div className="border-t border-slate-850/60 pt-3 mt-4 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1 text-slate-400 font-sans">
                      <User className="w-3.5 h-3.5 text-indigo-400/80" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      조회 {post.views}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AdSense In-Grid Horizontal Banner */}
          <div className="min-h-[85px] w-full" />

          {/* Pagination Selector */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                {currentPage} / {totalPages}
              </span>

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-2 bg-slate-900 border border-slate-850 rounded-xl text-slate-400 hover:text-slate-200 disabled:opacity-40 transition-all cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
