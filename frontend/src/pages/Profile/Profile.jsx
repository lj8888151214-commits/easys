import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile(){
 const nav=useNavigate(); const [user,setUser]=useState(null); const [error,setError]=useState("");
 useEffect(()=>{fetch('/api/member/me',{credentials:'include'}).then(r=>{if(!r.ok)throw new Error();return r.json()}).then(setUser).catch(()=>setError('로그인이 필요합니다.'))},[]);
 const logout=async()=>{await fetch('/api/logout',{method:'POST',credentials:'include'});nav('/')};
 if(error)return <main className="profile-page"><div className="profile-card"><h1>{error}</h1><Link to="/login">로그인하러 가기</Link></div></main>;
 if(!user)return <main className="profile-page"><div className="profile-card">불러오는 중...</div></main>;
 return <main className="profile-page"><div className="profile-card"><span className="auth-eyebrow">MY EASYS</span><h1>{user.nickname}님의 프로필</h1><dl><dt>이메일</dt><dd>{user.email}</dd><dt>생년월일</dt><dd>{user.birthday}</dd><dt>소개</dt><dd>{user.bio||'아직 자기소개가 없습니다.'}</dd></dl><button onClick={logout}>로그아웃</button></div></main>;
}
export default Profile;
