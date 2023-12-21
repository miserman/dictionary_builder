(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{69:function(e,t,n){Promise.resolve().then(n.bind(n,9488))},9488:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return eE}});var s=n(7437),r=n(8595),i=n(3948),l=n(3857),a=n(2265);let o=(0,a.createContext)({});function c(e){let{loadingTerms:t,loadingTermAssociations:n,loadingSynsets:r,loadingSynsetInfo:i,children:l}=e,[c,d]=(0,a.useState)(),[x,h]=(0,a.useState)(),[u,j]=(0,a.useState)(),[m,p]=(0,a.useState)(),[g,f]=(0,a.useState)(),[Z,y]=(0,a.useState)();return(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/terms.txt").then(e=>e.text()).then(e=>{let t=Object.freeze(e.split("\n"));d(t);let n={};t.forEach((e,t)=>n[e]=t),h(Object.freeze(n)),j(";;"+t.join(";;")+";;")}).finally(()=>t(!1))},[t]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/term_associations.json").then(e=>e.json()).then(e=>{p(e)}).finally(()=>n(!1))},[n]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/synsets.txt").then(e=>e.text()).then(e=>{f(Object.freeze(e.split("\n")))}).finally(()=>r(!1))},[r]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/synset_info.json").then(e=>e.json()).then(e=>{y(e)}).finally(()=>i(!1))},[i]),(0,s.jsx)(o.Provider,{value:{terms:c,termLookup:x,collapsedTerms:u,termAssociations:m,synsets:g,synsetInfo:Z},children:l})}let d=/\*/g,x=/^;|;$/g;function h(e,t){return e.length-t.length}function u(e,t){return t&&-1!==e?((1-e/t)*100).toFixed(2):"0"}let j=(0,a.createContext)({}),m=(0,a.createContext)(e=>{}),p=(0,a.createContext)([]),g=(0,a.createContext)(e=>{}),f=(0,a.createContext)({}),Z=(e,t)=>{let{terms:n,termLookup:s,termAssociations:r,synsetInfo:i}=t,l={type:"fixed",term:e,categories:{},recognized:!1,index:n&&s&&s[e]||-1,related:[],synsets:[]};if(r&&i&&n&&-1!==l.index){l.recognized=!0;let e=r[l.index];l.related=e[0]?(Array.isArray(e[0])?e[0]:[e[0]]).map(e=>n[e-1]):[],l.synsets=e[1]?(Array.isArray(e[1])?e[1]:[e[1]]).map(e=>i[e-1]):[]}return l},y=(e,t)=>{let n=d.test(e)?";"+e.replace(d,"[^;]*")+";":e;if(n===e)return Z(e,t);{let s={type:"fuzzy",term:e,categories:{},recognized:!1,regex:RegExp(n,"g"),matches:[]};if(t.collapsedTerms)for(let e;e=s.regex.exec(t.collapsedTerms);)s.matches.push(e[0].replace(x,""));return s.recognized=!!s.matches.length,s}};function v(e){let{children:t}=e,n=(0,a.useContext)(o),r=(0,a.useMemo)(()=>({}),[]),[i,l]=(0,a.useReducer)((e,t)=>{switch(t.type){case"collect":let n=new Set(t.reset?[]:e);return Object.keys(t.dictionary).forEach(e=>{let{categories:s}=t.dictionary[e];Object.keys(s).forEach(e=>n.add(e))}),Array.from(n).sort();case"add":return e.includes(t.cat)?[...e]:[...e,t.cat].sort();default:return e.filter(e=>e!==t.cat)}},[]),[c,d]=(0,a.useReducer)((e,t)=>{let s={...e};if("remove"===t.type)delete s[t.term];else{if("replace"===t.type&&delete s[t.originalTerm],t.term in r||(r[t.term]=y(t.term,n)),!t.sense){let e=r[t.term];"fixed"===e.type&&1===e.synsets.length&&(t.sense=e.synsets[0].key)}s[t.term]={categories:t.categories||{},sense:t.sense||""}}return l({type:"collect",dictionary:s}),s},{});return(0,s.jsx)(j.Provider,{value:c,children:(0,s.jsx)(p.Provider,{value:i,children:(0,s.jsx)(m.Provider,{value:d,children:(0,s.jsx)(g.Provider,{value:l,children:(0,s.jsx)(f.Provider,{value:r,children:t})})})})})}var C=n(8469),b=n(8956),k=n(9050),S=n(4111),w=n(5133),P=n(6114),z=n(2653),A=n(3457),T=n(3226),E=n(4864),F=n(7739),M=n(8276),O=n(1975),_=n(4081),I=n(819),R=n(4147),N=n(666),q=n(9245),Y=n(5795),B=n(3701),D=n(6988),K=n(9279),U=n(9464),W=n(5266),H=n(356),L=n(5210),$=n(8123),G=n(4262),X=n(7827);function J(e){let{info:t}=e,n=(0,a.useContext)(eu);return(0,s.jsx)(L.Z,{underline:"none",sx:{p:0,justifyContent:"flex-start",cursor:"pointer",display:"block"},onClick:()=>n({type:"add",state:{type:"synset",value:t.key,info:t}}),children:t.key})}let Q=/^\d+-\w$/,V=/-/g;function ee(e,t){return e=e.toLowerCase(),!t||e in t||(e=e.replace("'",""))in t||(e=e.replace(V," ")),e}function et(e){let{name:t,info:n,ids:r,allInfo:i}=e,l=n[t],{termLookup:c}=(0,a.useContext)(o);return(0,s.jsxs)(q.Z,{sx:{m:1},children:[(0,s.jsx)(T.Z,{variant:"h5",children:t}),(0,s.jsx)(T.Z,{children:"members"===t?Array.isArray(l)?l.map(e=>(0,s.jsx)(ex,{term:ee(e,c)},e)):(0,s.jsx)(ex,{term:ee(l,c)},l):Array.isArray(l)?l.map(Q.test(l[0])?e=>(0,s.jsx)(J,{info:i[r.indexOf(e)]},e):e=>(0,s.jsx)(X.Z,{label:e})):Q.test(l)?(0,s.jsx)(J,{info:i[r.indexOf(l)]}):l})]},t)}let en={key:0,index:0,ili:0,definition:0};function es(e){let{info:t}=e,{synsets:n,synsetInfo:r}=(0,a.useContext)(o);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(T.Z,{variant:"h6",children:t.definition}),(0,s.jsxs)(T.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Sense Key: ",(0,s.jsx)("span",{className:"number",children:t.key})]}),(0,s.jsxs)(T.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Open English WordNet ID: ",(0,s.jsx)("span",{className:"number",children:n&&n[t.index-1]})]}),(0,s.jsxs)(T.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Interlingual ID: ",(0,s.jsx)("span",{className:"number",children:t.ili})]}),(0,s.jsx)(A.Z,{direction:"row",sx:{mt:2},children:n&&r?Object.keys(t).filter(e=>!(e in en)).map(e=>(0,s.jsx)(et,{name:e,info:t,ids:n,allInfo:r},e)):(0,s.jsx)(s.Fragment,{})})]})}let er=/[aeiouy]$/;function ei(e,t){let n=new Set,s=RegExp(";(?:anti|de|dis|central|en|ex|faux|hyper|il|ill|in|intra|inter|ir|meso|mal|mid|middle|mis|miss|non|over|pan|post|pre|pro|re|retro|sudo|sub|super|un|uber|under|ultra|trans)?-?(?:"+e+(e.length>(er.test(e)?3:2)?"|"+e.replace(er,"[aeiouy]"):"")+"|"+e+e.substring(e.length-1)+")-?(?:'|ac|age|al|alize|ant|ary|at|ate|ation|cracy|cy|cycle|d|dom|ed|er|es|esque|est|ette|ey|ful|hood|ial|ic|ie|ies|ify|in|ing|ion|ionate|isation|ish|ise|ism|ist|ive|ize|ization|let|lets|lette|like|ling|lings|log|ly|ley|ment|nce|ness|or|ous|r|s|ship|st|th|ties|ty|ur|ward|wise|y|z)?(?:'|ate|ation|d|ed|er|es|in|ing|ion|ise|isation|ish|ize|ization|ly|ness|ous|s|y|z)?\\;","g");for(let r;r=s.exec(t);)r[0]&&";"+e+";"!==r[0]&&n.add(r[0].replace(x,""));return Array.from(n)}function el(e){let{processed:t,edit:n,label:r}=e,i=r?{}:{pt:0,pb:0},l=(0,a.useContext)(j)[t.term];return t.synsets.length?(0,s.jsx)(E.Z,{"aria-label":"assign synset",value:l.sense,onChange:e=>{l.sense=e.target.value,n({type:"update",term:t.term,categories:l.categories,sense:l.sense})},label:r,sx:{"& .MuiInputBase-input":i},children:t.synsets.map(e=>{let{key:t}=e;return(0,s.jsx)(F.Z,{value:t,children:(0,s.jsx)(M.Z,{title:e.definition,placement:"right",children:(0,s.jsx)(T.Z,{component:"span",children:t})})},t)})}):(0,s.jsx)(O.Z,{value:l.sense,onChange:e=>{l.sense=e.target.value,n({type:"update",term:t.term,categories:l.categories,sense:l.sense})},label:r,sx:{"& .MuiInputBase-input":i}})}function ea(e){let{processed:t,onRemove:n,onUpdate:r,edit:i}=e,[l,o]=(0,a.useState)(t.term);return(0,s.jsxs)(w.Z,{sx:{m:.5},children:[t.recognized?(0,s.jsx)($.Z,{color:"success",sx:{fontSize:".8rem",position:"absolute"},"aria-label":"recognized"}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(P.Z,{title:(0,s.jsxs)(A.Z,{direction:"row",children:[(0,s.jsx)(O.Z,{variant:"standard",value:l,onChange:e=>e.target&&"value"in e.target&&o(e.target.value),onKeyUp:e=>"code"in e&&"Enter"===e.code&&r(l)}),l!==t.term?(0,s.jsx)(k.Z,{onClick:()=>{r(l)},children:"Update"}):(0,s.jsx)(s.Fragment,{})]}),action:(0,s.jsx)(z.Z,{onClick:n,children:(0,s.jsx)(G.Z,{})})}),(0,s.jsx)(C.Z,{sx:{height:"25vh",pt:0},children:(0,s.jsx)(eh,{term:t.term})}),(0,s.jsx)(b.Z,{children:"fixed"===t.type?(0,s.jsxs)(_.Z,{children:[t.synsets.length?(0,s.jsx)(I.Z,{children:"Assigned Sense"}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(el,{processed:t,edit:i,label:"Assigned Sense"})]}):(0,s.jsx)(s.Fragment,{})})]})}function eo(e){let{processed:t,edit:n}=e,{terms:r}=(0,a.useContext)(o),i=(0,a.useContext)(p);return(0,s.jsxs)(R.Z,{children:[(0,s.jsx)(N.Z,{component:"th",children:(0,s.jsx)(ex,{term:t.term})}),"fixed"===t.type?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(N.Z,{children:(0,s.jsx)(el,{processed:t,edit:n})}),(0,s.jsx)(N.Z,{children:u(t.index,r&&r.length)}),(0,s.jsx)(N.Z,{children:t.recognized?1:0}),(0,s.jsx)(N.Z,{children:t.synsets.length}),(0,s.jsx)(N.Z,{children:t.related.length})]}):(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(N.Z,{}),(0,s.jsx)(N.Z,{}),(0,s.jsx)(N.Z,{children:t.matches.length}),(0,s.jsx)(N.Z,{}),(0,s.jsx)(N.Z,{})]}),i.map(e=>(0,s.jsx)(N.Z,{children:(0,s.jsx)(O.Z,{onChange:n=>{let s=+n.target.value;s?t.categories[e]=s:delete t.categories[e]},value:t.categories[e]?t.categories[e]:""})},e))]})}function ec(e){let{processed:t}=e,n=(0,a.useContext)(f),r=(0,a.useContext)(o),[i,l]=(0,a.useState)(0),[c,d]=(0,a.useState)(5),x=t.matches.length,h=[];if(x)for(let e=i*c,n=Math.min(t.matches.length,e+c);e<n;e++)h.push(t.matches[e]);if(!t.common_matches){let e="";t.matches.forEach(t=>{(!e||t.length<e.length)&&(e=t)}),t.common_matches=ei(e,";;"+t.matches.join(";;")+";;")}return(0,s.jsx)(q.Z,{sx:{height:"100%",overflowY:"auto"},children:x?(0,s.jsxs)(Y.Z,{sx:{height:"100%"},children:[(0,s.jsxs)(B.Z,{stickyHeader:!0,size:"small",sx:{width:"100%","& .MuiTableCell-root:first-of-type":{pl:.5},"& .MuiTableCell-root:last-of-type":{pr:.5}},children:[(0,s.jsx)(D.Z,{children:(0,s.jsxs)(R.Z,{children:[(0,s.jsx)(N.Z,{width:"999",children:"Match"}),(0,s.jsx)(N.Z,{align:"right",children:"Frequency"}),(0,s.jsx)(N.Z,{align:"right",children:"Senses"}),(0,s.jsx)(N.Z,{align:"right",children:"Related"})]})}),(0,s.jsx)(K.Z,{children:h.map((e,t)=>{e in n||(n[e]=y(e,r));let i=n[e];return(0,s.jsxs)(R.Z,{sx:{height:33},hover:!0,children:[(0,s.jsx)(N.Z,{children:(0,s.jsx)(ex,{term:e})}),(0,s.jsx)(N.Z,{align:"right",children:u(i.index,r.terms&&r.terms.length)}),(0,s.jsx)(N.Z,{align:"right",children:i.synsets.length}),(0,s.jsx)(N.Z,{align:"right",children:i.related.length})]},e+t)})})]}),(0,s.jsx)(U.Z,{component:"div",rowsPerPageOptions:[5,10,50,100,1e3],count:x,rowsPerPage:c,page:i,onPageChange:(e,t)=>{l(t)},onRowsPerPageChange:e=>{d(parseInt(e.target.value)),l(0)}})]}):(0,s.jsx)(T.Z,{children:"No matches"})})}function ed(e){let{processed:t}=e,n={p:1,maxHeight:"100%",overflowY:"auto",overflowX:"hidden"},r=(0,a.useContext)(o);return t.forms||(t.forms=ei(t.term,r.collapsedTerms?r.collapsedTerms:""),t.forms.sort(h)),(0,s.jsxs)(A.Z,{direction:"row",spacing:4,sx:{height:"100%"},children:[(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(M.Z,{title:"100 - index / n terms * 100; terms are losely sorted by frequency and space coverage",children:(0,s.jsx)(T.Z,{children:"Relative Frequency"})}),(0,s.jsx)(q.Z,{sx:{p:1},children:(0,s.jsx)("span",{className:"number",children:u(t.index,r.terms&&r.terms.length)})})]}),t.forms.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(T.Z,{children:"Expanded Forms"}),(0,s.jsx)(q.Z,{sx:n,children:(0,s.jsx)(W.Z,{sx:{p:0},children:t.forms.map(e=>(0,s.jsx)(H.ZP,{sx:{p:0},children:(0,s.jsx)(ex,{term:e})},e))})})]}):(0,s.jsx)(s.Fragment,{}),t.related.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(T.Z,{children:"Related Terms"}),(0,s.jsx)(q.Z,{sx:n,children:(0,s.jsx)(W.Z,{sx:{p:0},children:t.related.map(e=>(0,s.jsx)(H.ZP,{sx:{p:0},children:(0,s.jsx)(ex,{term:e})},e))})})]}):(0,s.jsx)(s.Fragment,{}),t.synsets.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(T.Z,{children:"Senses"}),(0,s.jsx)(q.Z,{sx:n,children:(0,s.jsx)(W.Z,{sx:{p:0},children:t.synsets.map(e=>(0,s.jsx)(H.ZP,{sx:{p:0},children:(0,s.jsx)(J,{info:e})},e.key))})})]}):(0,s.jsx)(s.Fragment,{})]})}function ex(e){let{term:t}=e,n=(0,a.useContext)(eu);return(0,s.jsx)(L.Z,{underline:"none",sx:{p:0,justifyContent:"flex-start",cursor:"pointer",display:"block"},onClick:()=>n({type:"add",state:{type:"term",value:t}}),children:t})}function eh(e){let{term:t}=e,n=(0,a.useContext)(f),r=(0,a.useContext)(o);t in n||(n[t]=y(t,r));let i=n[t];return"fixed"===i.type?(0,s.jsx)(ed,{processed:i}):(0,s.jsx)(ec,{processed:i})}let eu=(0,a.createContext)(e=>{});function ej(e){let{term:t}=e,n=(0,a.useContext)(j),r=(0,a.useContext)(m);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(C.Z,{sx:{overflowY:"auto"},children:(0,s.jsx)(eh,{term:t})}),(0,s.jsx)(b.Z,{sx:{justifyContent:"flex-end",mt:"auto"},children:(0,s.jsx)(k.Z,{onClick:()=>{r({type:t in n?"remove":"add",term:t})},children:t in n?"Remove":"Add"})})]})}function em(e){let{info:t}=e;return(0,s.jsx)(C.Z,{sx:{overflowY:"auto",mb:"auto"},children:(0,s.jsx)(es,{info:t})})}function ep(e){let{state:t,index:n,request:r}=e;if(!t.length)return;let i=()=>r({type:"reset"}),l=t[n];return(0,s.jsx)(S.ZP,{open:""!==l.value,onClose:i,variant:"permanent",hideBackdrop:!0,anchor:"bottom",sx:{"& .MuiPaper-root":{height:"45vh",display:"flex",flexDirection:"column",justifyContent:"space-between"}},children:(0,s.jsxs)(w.Z,{children:[(0,s.jsx)(P.Z,{action:(0,s.jsx)(z.Z,{"aria-label":"Close",onClick:i,children:(0,s.jsx)(G.Z,{})}),title:(0,s.jsxs)(A.Z,{direction:"row",children:[(0,s.jsx)(k.Z,{onClick:()=>r({type:"move",direction:1}),disabled:n>=t.length-1,sx:{opacity:.7},children:t.length>n+1?t[n+1].value:""}),(0,s.jsx)(T.Z,{variant:"h4",children:l.value}),(0,s.jsx)(k.Z,{onClick:()=>r({type:"move",direction:-1}),disabled:n<1,sx:{opacity:.7},children:n>0?t[n-1].value:""})]})}),"term"===l.type?(0,s.jsx)(ej,{term:l.value}):(0,s.jsx)(em,{info:l.info})]})})}var eg=n(6882),ef=n(8938),eZ=n(502),ey=n(8457),ev=n(6500),eC=n(4989),eb=n(8440),ek=n(182),eS=n(4647);function ew(e){let{terms:t,exists:n,add:r,asTable:i,displayToggle:l}=e,o=(0,a.useMemo)(()=>t?new Map(t.map(e=>[e,!0])):new Map,[t]),[c,d]=(0,a.useState)(""),[x,h]=(0,a.useState)(!1),[u,j]=(0,a.useState)([]),[m,p]=(0,a.useState)(!1),g=e=>{let t=e?"string"==typeof e?e:"innerText"in e.target?e.target.innerText:c:c;t&&!n(t)&&(r(t),j([]),d(""))},f=e=>{let t=e.target;if(t&&"value"in t){let e=t.value.toLowerCase();h(n(e)),d(e)}},Z=()=>p(!m);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(ev.Z,{component:"nav",children:(0,s.jsxs)(eC.Z,{variant:"dense",sx:{justifyContent:"space-between"},disableGutters:!0,children:[(0,s.jsxs)(A.Z,{direction:"row",sx:{width:"40%"},spacing:1,children:[(0,s.jsx)(eb.Z,{options:u,value:c,onKeyUp:e=>{if("code"in e&&"Enter"===e.code)g();else if(t){let e=[];c.length>2&&o.forEach((t,n)=>{n.startsWith(c)&&e.push(n)}),j(e)}},onChange:f,renderOption:(e,t)=>(0,a.createElement)(H.ZP,{...e,key:t,onClick:g},t),renderInput:e=>(0,s.jsx)(O.Z,{...e,variant:"outlined",size:"small",placeholder:"term to add",value:c,onKeyDown:e=>{"code"in e&&"Enter"===e.code&&g()},onChange:f,error:x}),fullWidth:!0,freeSolo:!0}),(0,s.jsx)(k.Z,{variant:"contained",onClick:()=>g(),disabled:x,children:"Add"})]}),(0,s.jsx)(z.Z,{onClick:Z,children:(0,s.jsx)(ey.Z,{})})]})}),(0,s.jsx)(S.ZP,{anchor:"right",open:m,onClose:Z,children:(0,s.jsxs)(w.Z,{sx:{height:"100%",width:"12em"},children:[(0,s.jsx)(P.Z,{title:(0,s.jsx)(T.Z,{children:"Settings"}),action:(0,s.jsx)(z.Z,{onClick:Z,children:(0,s.jsx)(G.Z,{})})}),(0,s.jsx)(C.Z,{sx:{alignContent:"left"},children:(0,s.jsx)(ek.Z,{sx:{width:"100%"},label:"As Table",control:(0,s.jsx)(eS.Z,{checked:i,onChange:l})})})]})})]})}let eP=[{key:"terms",label:"Terms"},{key:"termAssociations",label:"Term Associations"},{key:"synsets",label:"Synsets"},{key:"synsetInfo",label:"Synset Info"}];function ez(e){let{loading:t,drawerOpen:n}=e,r=(0,a.useContext)(o),i=(0,a.useContext)(j),l=(0,a.useContext)(p),c=(0,a.useContext)(f),d=(0,a.useContext)(m),[x,h]=(0,a.useState)(!0),u=e=>e in i,g=Object.keys(i).sort();return(0,s.jsx)(q.Z,{children:r.termAssociations&&r.synsetInfo?(0,s.jsxs)(ef.Z,{children:[(0,s.jsx)(ew,{terms:r.terms,exists:u,add:e=>{d({type:"add",term:e})},asTable:x,displayToggle:(e,t)=>h(t)}),(0,s.jsx)(q.Z,{component:"main",sx:{position:"absolute",top:0,right:0,bottom:0,left:0,overflowY:"auto",mt:"3.5em",mb:n?"45vh":0,pr:1,pb:1,pl:1},children:g.length?x?(0,s.jsxs)(B.Z,{stickyHeader:!0,sx:{"& .MuiTableCell-root":{p:.5,textAlign:"right"},"& th.MuiTableCell-root:first-of-type":{textAlign:"left"}},children:[(0,s.jsx)(D.Z,{children:(0,s.jsxs)(R.Z,{children:[(0,s.jsx)(N.Z,{component:"th",children:"Term"}),(0,s.jsx)(N.Z,{component:"th",children:"Sense"}),(0,s.jsx)(N.Z,{component:"th",children:"Frequency"}),(0,s.jsx)(N.Z,{component:"th",children:"Matches"}),(0,s.jsx)(N.Z,{component:"th",children:"Senses"}),(0,s.jsx)(N.Z,{component:"th",children:"related"}),l.map(e=>(0,s.jsx)(N.Z,{component:"th",children:e},"category_"+e))]})}),(0,s.jsx)(K.Z,{children:g.map(e=>{let t=c[e];return(0,s.jsx)(eo,{processed:t,edit:d},e)})})]}):g.map(e=>(0,s.jsx)(ea,{processed:c[e],onRemove:()=>{d({type:"remove",term:e})},onUpdate:t=>{t&&!u(t)&&d({type:"replace",term:t,originalTerm:e})},edit:d},e)):(0,s.jsx)(T.Z,{align:"center",children:"Add terms, or import an existing dictionary."})})]}):(0,s.jsxs)(A.Z,{sx:{margin:"auto",marginTop:10,maxWidth:350},children:[(0,s.jsx)(T.Z,{children:"Loading Resources..."}),(0,s.jsx)(W.Z,{children:eP.map(e=>{let{key:n,label:i}=e;return(0,s.jsx)(H.ZP,{children:(0,s.jsxs)(T.Z,{children:[r[n]?(0,s.jsx)($.Z,{color:"success"}):t[n]?(0,s.jsx)(eg.Z,{size:"1.5rem"}):(0,s.jsx)(eZ.Z,{color:"error",sx:{marginBottom:-.8}}),r[n]||t[n]?"":"Failed to load ",i]})},n)})})]})})}let eA=(0,r.Z)({palette:{mode:"dark"}}),eT=(e,t)=>"reset"===t.type?[]:"trim"===t.type?[...t.state]:e.length&&e[0].value===t.state.value?[...e]:[t.state,...e];function eE(){let[e,t]=(0,a.useState)(!0),[n,r]=(0,a.useState)(!0),[o,d]=(0,a.useState)(!0),[x,h]=(0,a.useState)(!0),[u,j]=(0,a.useReducer)(eT,[]),[m,p]=(0,a.useState)(0),[g,f]=(0,a.useState)(0);return g&&m!==u.length&&(p(u.length),f(0)),(0,s.jsx)(a.StrictMode,{children:(0,s.jsxs)(i.Z,{theme:eA,children:[(0,s.jsx)(l.ZP,{}),(0,s.jsx)(c,{loadingTerms:t,loadingTermAssociations:r,loadingSynsets:d,loadingSynsetInfo:h,children:(0,s.jsx)(v,{children:(0,s.jsxs)(eu.Provider,{value:j,children:[(0,s.jsx)(ez,{loading:{terms:e,termAssociations:n,synsets:o,synsetInfo:x},drawerOpen:!!u.length}),(0,s.jsx)(ep,{state:u,index:g,request:e=>{let{type:t,direction:n}=e;"reset"===t?(j({type:"reset"}),f(0)):f(Math.max(0,Math.min(u.length-1,g+n))),p(u.length)}})]})})})]})})}}},function(e){e.O(0,[374,971,938,744],function(){return e(e.s=69)}),_N_E=e.O()}]);