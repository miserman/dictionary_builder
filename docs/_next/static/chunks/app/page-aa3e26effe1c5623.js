(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{69:function(e,t,s){Promise.resolve().then(s.bind(s,5374))},5374:function(e,t,s){"use strict";s.r(t),s.d(t,{default:function(){return N}});var n=s(7437),r=s(8595),i=s(3948),c=s(3857),o=s(2498),l=s(3226),a=s(5266),d=s(356),h=s(6882),x=s(9245),m=s(56),u=s(9050),j=s(5133),g=s(6114),f=s(2653),Z=s(8469),p=s(9872),y=s(2265),z=s(8123),k=s(502),v=s(4262);let _=["'","'d","'in","'s","ac","age","ant","ary","at","cracy","cy","cycle","d","dom","e","ed","er","es","esque","est","ette","ey","ful","hood","ic","ie","ies","ify","in","ing","ion","ish","ive","ize","let","lets","lette","like","-like","ling","lings","log","ly","ley","ment","nce","ness","or","ous","ousness","ously","r","s","ship","st","th","ties","ty","ur","ward","wise","y","ys","z"],S=/\*/g,b=/^;|;$/g;function E(e,t){return e.length-t.length}let w=(0,r.Z)({palette:{mode:"dark"}});function N(){let[e,t]=(0,y.useState)(!0),[s,r]=(0,y.useState)(!0),[N,O]=(0,y.useState)([]),[C,P]=(0,y.useState)(""),[R,T]=(0,y.useState)(null),[F,W]=(0,y.useState)([]),[A,B]=(0,y.useState)(null);(0,y.useEffect)(()=>{fetch("/dictionary_builder/data/term_associations.json").then(e=>e.json()).then(e=>{let t=Object.keys(e);O(t),P(";;"+t.join(";;")+";;"),T(e)}).finally(()=>t(!1))},[]),(0,y.useEffect)(()=>{fetch("/dictionary_builder/data/synsets.json").then(e=>e.json()).then(e=>{W(Object.keys(e)),B(e)}).finally(()=>r(!1))},[]);let L=e=>{let t=S.test(e)?";"+e.replace(S,"[^;]*")+";":e;if(t===e)return{type:"fixed",term:e,categories:{},recognized:R&&e in R,synsets:[],synset:""};{let s={type:"fuzzy",term:e,categories:{},recognized:!1,regex:RegExp(t,"g"),matches:[],common_matches:{}};for(let e;e=s.regex.exec(C);)s.matches.push(e[0].replace(b,""));return s.matches.length&&(s.recognized=!0,s.common_matches=function(e){let t={},s="";if(e.forEach(e=>{(!s||e.length<s.length)&&(s=e)}),s){let n=RegExp(s+"*");e.forEach(e=>{if(e===s)t[e]={root:s,part:""};else{let r=e.replace(n,"");-1!==_.indexOf(r)&&(t[e]={root:s,part:e.replace(s,"")})}})}return t}(s.matches)),s}},[M,q]=(0,y.useState)(""),[D,H]=(0,y.useState)([]),[I,K]=(0,y.useReducer)((e,t)=>{let s=[...e];return"remove"===t.key?s.splice(t.index,1):s["update"===t.key?t.index:e.length]=L(t.value),s},[]),Y=()=>{M&&-1===D.indexOf(M)&&(H([...D,M]),K({key:"add",value:M}),q(""))};return(0,n.jsx)(y.StrictMode,{children:(0,n.jsxs)(i.Z,{theme:w,children:[(0,n.jsx)(c.ZP,{}),R&&A?(0,n.jsx)(x.Z,{sx:{margin:"auto",maxWidth:1e3},children:(0,n.jsxs)(o.Z,{sx:{margin:1},children:[(0,n.jsxs)(o.Z,{direction:"row",children:[(0,n.jsx)(m.Z,{value:M,onKeyDown:e=>{"code"in e&&"Enter"===e.code&&Y()},onChange:e=>{let t=e.target;t&&"value"in t&&q(t.value)},variant:"outlined",label:"Term to add",helperText:(0,n.jsxs)(l.Z,{variant:"caption",children:["Enter a fixed or glob term (e.g., ",(0,n.jsx)("code",{children:"frog"})," or ",(0,n.jsx)("code",{children:"frog*"}),")."]}),fullWidth:!0}),(0,n.jsx)(u.Z,{onClick:Y,children:"Add"})]}),I.map((e,t)=>(0,n.jsxs)(j.Z,{sx:{m:.5},children:[e.recognized?(0,n.jsx)(z.Z,{color:"success",sx:{fontSize:".8rem",position:"absolute"},"aria-label":"recognized"}):(0,n.jsx)(n.Fragment,{}),(0,n.jsx)(g.Z,{title:e.term,action:(0,n.jsx)(f.Z,{onClick:()=>{let e=[...D];e.splice(t,1),H([...e]),K({key:"remove",index:t})},children:(0,n.jsx)(v.Z,{})})}),(0,n.jsx)(Z.Z,{children:(0,n.jsx)(o.Z,{direction:"row",children:"fuzzy"===e.type?(0,n.jsxs)(p.Z,{children:[(0,n.jsxs)(l.Z,{children:["Matches"," ("+e.matches.length+")"]}),e.matches.length?(0,n.jsx)(x.Z,{sx:{maxHeight:200,overflowY:"auto"},children:(0,n.jsx)(a.Z,{sx:{marginLeft:"12px"},children:[...e.matches.filter(t=>t in e.common_matches).sort(E),...e.matches.filter(t=>!(t in e.common_matches)).sort(E)].map((t,s)=>{let r=e.common_matches[t];return(0,n.jsx)(d.ZP,{sx:{p:0},children:r?(0,n.jsxs)(l.Z,{className:""===r.part?"match-root":"",children:[(0,n.jsx)("span",{className:"term-root",children:r.root}),(0,n.jsx)("span",{children:r.part})]}):(0,n.jsx)(l.Z,{className:"match-uncommon",children:t})},s)})})}):(0,n.jsx)(l.Z,{children:"No matches"})]}):(0,n.jsx)(p.Z,{elevation:1,children:(0,n.jsxs)(l.Z,{children:["Recognized:",(0,n.jsx)("span",{style:{color:w.palette[e.recognized?"success":"info"].main},children:" "+e.recognized})]})})})})]},t))]})}):(0,n.jsxs)(o.Z,{sx:{margin:"auto",marginTop:10,maxWidth:350},children:[(0,n.jsx)(l.Z,{children:"Loading Resources..."}),(0,n.jsxs)(a.Z,{children:[(0,n.jsx)(d.ZP,{children:(0,n.jsxs)(l.Z,{children:[R?(0,n.jsx)(z.Z,{color:"success"}):e?(0,n.jsx)(h.Z,{size:"1.5rem"}):(0,n.jsx)(k.Z,{color:"error",sx:{marginBottom:-.8}}),R||e?"":"Failed to load ","Term Associations"]})}),(0,n.jsxs)(d.ZP,{children:[A?(0,n.jsx)(z.Z,{color:"success"}):s?(0,n.jsx)(h.Z,{size:"1.5rem"}):(0,n.jsx)(k.Z,{color:"error",sx:{marginBottom:-.8}}),A||s?"":"Failed to load ","Synset Info"]})]})]})]})})}}},function(e){e.O(0,[670,971,938,744],function(){return e(e.s=69)}),_N_E=e.O()}]);