import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

function StudyDetail(){
 const [params]=useSearchParams(); const id=params.get('id'); const [study,setStudy]=useState(null); const [error,setError]=useState('');
 useEffect(()=>{if(!id)return;fetch(`/api/study/${id}`).then(r=>{if(!r.ok)throw new Error('스터디를 찾을 수 없습니다.');return r.json()}).then(setStudy).catch(e=>setError(e.message))},[id]);
 if(error)return <main style={{padding:'100px 20px',textAlign:'center'}}><h2>{error}</h2><Link to="/study">스터디로 돌아가기</Link></main>;
 if(!study)return <main style={{padding:'100px 20px',textAlign:'center'}}>불러오는 중...</main>;
 return <main style={{maxWidth:900,margin:'0 auto',padding:'100px 20px'}}><h1>{study.title}</h1><p>{study.content}</p><p>분야: {study.category}</p><p>모집 인원: {study.currentMembers}/{study.maxMembers}</p><p>방장: {study.nickname}</p><Link to="/study">← 목록으로</Link></main>;
}
export default StudyDetail;
