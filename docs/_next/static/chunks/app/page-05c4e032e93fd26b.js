(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{69:function(e,t,n){Promise.resolve().then(n.bind(n,8270))},8270:function(e,t,n){"use strict";n.r(t),n.d(t,{default:function(){return te}});var s=n(7437),r=n(8595),i=n(3948),l=n(3857),a=n(2265);let o=(0,a.createContext)({});function c(e){let{loadingTerms:t,loadingTermAssociations:n,loadingSenseKeys:r,loadingSynsetInfo:i,children:l}=e,[c,d]=(0,a.useState)(),[x,h]=(0,a.useState)(),[u,j]=(0,a.useState)(),[p,m]=(0,a.useState)(),[g,f]=(0,a.useState)(),[y,Z]=(0,a.useState)();return(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/terms.txt").then(e=>e.text()).then(e=>{let t=Object.freeze(e.split("\n"));d(t);let n={};t.forEach((e,t)=>n[e]=t),h(Object.freeze(n)),j(";;"+t.join(";;")+";;")}).finally(()=>t(!1))},[t]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/term_associations.json").then(e=>e.json()).then(e=>{m(e)}).finally(()=>n(!1))},[n]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/sense_keys.txt").then(e=>e.text()).then(e=>{f(Object.freeze(e.split("\n")))}).finally(()=>r(!1))},[r]),(0,a.useEffect)(()=>{fetch("/dictionary_builder/data/synset_info.json").then(e=>e.json()).then(e=>{Z(e.map((e,t)=>(e.index=t,e)))}).finally(()=>i(!1))},[i]),(0,s.jsx)(o.Provider,{value:{terms:c,termLookup:x,collapsedTerms:u,termAssociations:p,sense_keys:g,synsetInfo:y},children:l})}let d=/\*/,x=/\*/g,h=/([\[\]\(\)*?^$.+])/g,u=/^;|;$/g,j=/([\[\]\(\)?^$.+])/g;function p(e){return";"+e.replace(j,"\\$&").replace(x,"[^;]*")+";"}function m(e,t){return e.length-t.length}function g(e,t){return t&&-1!==e?((1-e/t)*100).toFixed(2):"0"}function f(e,t){let n=arguments.length>2&&void 0!==arguments[2]?arguments[2]:[],s=arguments.length>3&&void 0!==arguments[3]?arguments[3]:1/0;for(let r,i="";n.length<s&&(r=e.exec(t));)(i=r[0].replace(u,""))&&n.push(i);return n}let y=/\./g;function Z(e){return";"+e.replace(y,"[^;]")+";"}let v=/^.*[/\\]/;function b(e){return e.replace(v,"")}var C=n(8457),w=n(4262),S=n(2653),k=n(4111),_=n(5133),E=n(6114),O=n(3226),T=n(8469),A=n(3457),F=n(182),P=n(4647),z=n(4081),N=n(819),I=n(654),R=n(5507),M=n(8956),D=n(9050);function B(){return JSON.parse(localStorage.getItem("dictionary_builder_settings")||"{}")}function W(e){let{asTable:t,displayToggle:n,sortBy:r,setSortBy:i}=e,[l,o]=(0,a.useState)(!1),c=()=>o(!l);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(S.Z,{onClick:c,children:(0,s.jsx)(C.Z,{})}),(0,s.jsx)(k.ZP,{anchor:"right",open:l,onClose:c,children:(0,s.jsxs)(_.Z,{sx:{height:"100%",width:"12em",display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,s.jsx)(E.Z,{title:(0,s.jsx)(O.Z,{children:"Settings"}),action:(0,s.jsx)(S.Z,{onClick:c,children:(0,s.jsx)(w.Z,{})})}),(0,s.jsx)(T.Z,{sx:{alignContent:"left",mb:"auto"},children:(0,s.jsxs)(A.Z,{spacing:3,children:[(0,s.jsx)(F.Z,{sx:{width:"100%"},label:"As Table",control:(0,s.jsx)(P.Z,{checked:t,onChange:n})}),(0,s.jsxs)(z.Z,{children:[(0,s.jsx)(N.Z,{children:"Sort By"}),(0,s.jsxs)(I.Z,{size:"small",label:"Sort By",value:r,onChange:i,children:[(0,s.jsx)(R.Z,{value:"time",children:"Order Added"}),(0,s.jsx)(R.Z,{value:"term",children:"Term"})]})]})]})}),(0,s.jsx)(M.Z,{children:(0,s.jsx)(D.Z,{fullWidth:!0,color:"error",onClick:()=>{let e=B();e.dictionary_names&&e.dictionary_names.forEach(e=>localStorage.removeItem(e)),localStorage.removeItem("dictionary_builder_settings"),window.location.reload()},children:"Clear Storage"})})]})})]})}let J=(0,a.createContext)("default"),K=(0,a.createContext)(e=>{}),$=(0,a.createContext)({}),H=(0,a.createContext)(e=>{}),U=(0,a.createContext)({}),Y=(0,a.createContext)(e=>{}),q=(0,a.createContext)([]),L=(0,a.createContext)(e=>{}),G=(0,a.createContext)({}),V=(e,t)=>{let{terms:n,termLookup:s,termAssociations:r,synsetInfo:i}=t,l={type:"fixed",term:e,term_type:"fixed",categories:{},recognized:!1,index:n&&s&&s[e]||-1,related:[],synsets:[]};if(r&&i&&n&&-1!==l.index){l.recognized=!0;let e=r[l.index];l.related=e[0]?(Array.isArray(e[0])?e[0]:[e[0]]).map(e=>n[e-1]):[],l.synsets=e[1]?(Array.isArray(e[1])?e[1]:[e[1]]).map(e=>i[e-1]):[]}return l},X=(e,t)=>{let n="string"==typeof e;if(n&&!d.test(e))return V(e,t);{let s=n?p(e):e.source,r={type:"fuzzy",term_type:n?"glob":"regex",term:n?e:e.source,categories:{},recognized:!1,regex:RegExp(n?s:Z(s),"g"),matches:[]};return t.collapsedTerms&&f(r.regex,t.collapsedTerms,r.matches),r.recognized=!!r.matches.length,r}};function Q(e){let{children:t}=e,n=(0,a.useContext)(o),r=(0,a.useMemo)(()=>({}),[]),i=(0,a.useMemo)(B,[]),l=(0,a.useMemo)(()=>{let e={default:{}};return(i.dictionary_names||[]).forEach(t=>{e[t]=JSON.parse(localStorage.getItem("dict_"+t)||"{}")}),e},[i]),c=e=>{"delete"===e.type?(delete l[e.name],localStorage.removeItem("dict_"+e.name),"default"===e.name&&(l.default={}),d===e.name&&(h("default"),m({type:"change_dict",dict:l.default}))):("set"!==e.type&&(l[e.name]=e.dict),d&&localStorage.setItem("dict_"+e.name,JSON.stringify(l[d])),"save"!==e.type&&(h(e.name),m({type:"change_dict",dict:l[e.name]})),localStorage.setItem("dict_"+e.name,JSON.stringify(l[e.name]))),i.dictionary_names=Object.keys(l),localStorage.setItem("dictionary_builder_settings",JSON.stringify(i))},[d,x]=(0,a.useState)(i.selected||"default"),h=e=>{let t=e in l?e:"default";x(t),i.selected=t,localStorage.setItem("dictionary_builder_settings",JSON.stringify(i))},[u,j]=(0,a.useReducer)((e,t)=>{switch(t.type){case"collect":let n=new Set(t.reset?[]:e);return Object.keys(t.dictionary).forEach(e=>{let{categories:s}=t.dictionary[e];Object.keys(s).forEach(e=>n.add(e))}),Array.from(n).sort();case"add":return e.includes(t.cat)?[...e]:[...e,t.cat].sort();default:return e.filter(e=>e!==t.cat)}},[]),[p,m]=(0,a.useReducer)((e,t)=>{if("change_dict"===t.type)return j({type:"collect",dictionary:t.dict,reset:!0}),t.dict;let s={...e},i="string"==typeof t.term?t.term:t.term.source;if("remove"===t.type)delete s[i];else{"replace"===t.type&&delete s["string"==typeof t.originalTerm?t.originalTerm:t.originalTerm.source];let e=r[i];if(e&&t.term_type===e.term_type||(r[i]=X(t.term,n)),!t.sense){let e=r[i];"fixed"===e.type&&1===e.synsets.length&&n.sense_keys&&(t.sense=n.sense_keys[e.synsets[0].index])}let l=s[i]||{};s[i]={added:l.added||Date.now(),type:l.type||e&&e.term_type||"fixed",categories:t.categories||l.categories||{},sense:t.sense||l.sense||""}}return j({type:"collect",dictionary:s}),c({type:"save",name:d,dict:s}),s},l.default);return(0,a.useEffect)(()=>{i.selected&&i.selected in l||(i.selected="default"),m({type:"change_dict",dict:l[i.selected]})},[i,l]),(0,s.jsx)($.Provider,{value:l,children:(0,s.jsx)(H.Provider,{value:c,children:(0,s.jsx)(J.Provider,{value:d,children:(0,s.jsx)(U.Provider,{value:p,children:(0,s.jsx)(q.Provider,{value:u,children:(0,s.jsx)(K.Provider,{value:e=>{h(e)},children:(0,s.jsx)(Y.Provider,{value:m,children:(0,s.jsx)(L.Provider,{value:j,children:(0,s.jsx)(G.Provider,{value:r,children:t})})})})})})})})})}var ee=n(8276),et=n(1975),en=n(9245),es=n(3932),er=n(4147),ei=n(666),el=n(5795),ea=n(3701),eo=n(6988),ec=n(9279),ed=n(9464),ex=n(5266),eh=n(356),eu=n(5210),ej=n(8123);function ep(e){let{senseKey:t,info:n}=e,r=(0,a.useContext)(eT);return(0,s.jsx)(ee.Z,{title:n.definition,placement:"right",children:(0,s.jsx)(eu.Z,{underline:"none",sx:{p:0,justifyContent:"flex-start",cursor:"pointer",display:"block"},onClick:()=>r({type:"add",state:{type:"synset",value:t,info:n}}),children:t})})}function em(e){let{name:t,info:n}=e,r=n[t],{terms:i,sense_keys:l,synsetInfo:c}=(0,a.useContext)(o);return i&&l&&c?(0,s.jsxs)(en.Z,{sx:{m:1},children:[(0,s.jsx)(O.Z,{variant:"h5",children:t}),(0,s.jsx)(O.Z,{children:"string"==typeof r?r:"members"===t?i?Array.isArray(r)?r.map(e=>(0,s.jsx)(eE,{term:i[e-1]},e)):(0,s.jsx)(eE,{term:i[r-1]},r):(0,s.jsx)(s.Fragment,{}):Array.isArray(r)?r.map(e=>{let t=c[e-1];return(0,s.jsx)(ep,{senseKey:l[e-1],info:t},e)}):(0,s.jsx)(ep,{senseKey:l[r-1],info:c[r-1]})})]},t):(0,s.jsx)(s.Fragment,{})}let eg={id:0,index:0,ili:0,definition:0,topic:0},ef={a:"adj",r:"adv",s:"adj",n:"noun",v:"verb"};function ey(e){let{info:t}=e,{sense_keys:n}=(0,a.useContext)(o);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(O.Z,{variant:"h6",children:t.definition}),(0,s.jsxs)(A.Z,{direction:"row",spacing:2,children:[(0,s.jsxs)(en.Z,{children:[(0,s.jsxs)(O.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Open English WordNet ID: ",(0,s.jsx)("span",{className:"number",children:t.id})]}),(0,s.jsxs)(O.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Sense Key: ",(0,s.jsx)("span",{className:"number",children:n&&n[t.index]})]}),(0,s.jsxs)(O.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Interlingual ID: ",(0,s.jsx)("span",{className:"number",children:t.ili})]})]}),(0,s.jsxs)(en.Z,{children:[(0,s.jsxs)(O.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Part of Speech:"," ",(0,s.jsx)("span",{className:"number",children:ef[t.id.substring(t.id.length-1)]})]}),(0,s.jsxs)(O.Z,{component:"p",variant:"caption",sx:{ml:1},children:["Topic: ",(0,s.jsx)("span",{className:"number",children:t.topic})]})]})]}),(0,s.jsx)(A.Z,{direction:"row",sx:{mt:2},children:Object.keys(t).filter(e=>!(e in eg)).map(e=>(0,s.jsx)(em,{name:e,info:t},e))})]})}let eZ=/[aeiouy]$/;function ev(e,t){let n,s;let r=new Set;e=e.replace(h,"\\$&");try{n=RegExp(";(?:anti|de|dis|central|en|ex|faux|hyper|il|ill|in|intra|inter|ir|meso|mal|mid|middle|mis|miss|non|over|pan|post|pre|pro|re|retro|sudo|sub|super|un|uber|under|ultra|trans)?-?(?:"+e+(e.length>(eZ.test(e)?3:2)?"|"+e.replace(eZ,"[aeiouy]"):"")+"|"+e+e.substring(e.length-1)+")-?(?:'|ac|age|al|alize|ant|ary|at|ate|ation|cracy|cy|cycle|d|dom|ed|er|es|esque|est|ette|ey|ful|hood|ial|ic|ie|ies|ify|in|ing|ion|ionate|isation|ish|ise|ism|ist|ive|ize|ization|let|lets|lette|like|ling|lings|log|ly|ley|ment|nce|ness|or|ous|r|s|ship|st|th|ties|ty|ur|ward|wise|y|z)?(?:'|ate|ation|d|ed|er|es|in|ing|ion|ise|isation|ish|ize|ization|ly|ness|ous|s|y|z)?\\;","g")}catch(e){}if(n)for(;s=n.exec(t);)s[0]&&";"+e+";"!==s[0]&&r.add(s[0].replace(u,""));return Array.from(r)}function eb(e){let{processed:t,edit:n,label:r}=e,i=(0,a.useContext)(U)[t.term].sense,{sense_keys:l}=(0,a.useContext)(o);return t.synsets.length?(0,s.jsx)(I.Z,{fullWidth:!0,"aria-label":"assign synset",value:i,onChange:e=>{n({type:"update",term:t.term,term_type:t.term_type,sense:e.target.value})},label:r,children:l&&t.synsets.map(e=>{let{index:t}=e;return(0,s.jsx)(R.Z,{value:l[t],children:(0,s.jsx)(ee.Z,{title:e.definition,placement:"right",children:(0,s.jsx)(O.Z,{sx:{width:"100%"},children:l[t]})})},t)})}):(0,s.jsx)(et.Z,{value:i,onChange:e=>{n({type:"update",term:t.term,term_type:t.term_type,sense:e.target.value})},label:r})}function eC(e){let{processed:t,edit:n}=e,r=(0,a.useContext)(U)[t.term].categories,i=(0,a.useContext)(q),[l,o]=(0,a.useState)(null);return(0,s.jsxs)(en.Z,{children:[(0,s.jsx)(D.Z,{variant:"contained",sx:{p:2},onClick:e=>o(e.currentTarget),children:"Categories"}),(0,s.jsx)(es.Z,{anchorEl:l,open:!!l,onClose:()=>o(null),children:i.map(e=>(0,s.jsx)(R.Z,{children:(0,s.jsx)(et.Z,{label:e,size:"small",variant:"filled",value:r[e]||"",onChange:s=>{r[e]=+s.target.value,n({type:"update",term:t.term,term_type:t.term_type,categories:r})}})},e))})]})}function ew(e){let{processed:t,onRemove:n,onUpdate:r,edit:i}=e,[l,o]=(0,a.useState)(t.term);return(0,s.jsxs)(_.Z,{sx:{m:.5},children:[t.recognized?(0,s.jsx)(ej.Z,{color:"success",sx:{fontSize:".8rem",position:"absolute"},"aria-label":"recognized"}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(E.Z,{title:(0,s.jsxs)(A.Z,{direction:"row",children:[(0,s.jsx)(et.Z,{variant:"standard",value:l,onChange:e=>e.target&&"value"in e.target&&o(e.target.value),onKeyUp:e=>"code"in e&&"Enter"===e.code&&r(l)}),l!==t.term?(0,s.jsx)(D.Z,{onClick:()=>{r(l)},children:"Update"}):(0,s.jsx)(s.Fragment,{})]}),action:(0,s.jsx)(S.Z,{onClick:n,children:(0,s.jsx)(w.Z,{})})}),(0,s.jsx)(T.Z,{sx:{height:"25vh",pt:0},children:(0,s.jsx)(eO,{term:t.term})}),(0,s.jsx)(M.Z,{children:(0,s.jsxs)(A.Z,{direction:"row",spacing:1,children:["fixed"===t.type?(0,s.jsxs)(z.Z,{children:[t.synsets.length?(0,s.jsx)(N.Z,{children:"Assigned Sense"}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(eb,{processed:t,edit:i,label:"Assigned Sense"})]}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(eC,{processed:t,edit:i})]})})]})}function eS(e){let{processed:t,edit:n}=e,{terms:r}=(0,a.useContext)(o),i=(0,a.useContext)(q),l=(0,a.useContext)(U)[t.term];return(0,s.jsxs)(er.Z,{className:"dense-table-row",children:[(0,s.jsx)(ei.Z,{component:"th",width:1,children:(0,s.jsx)(eE,{term:t.term})}),"fixed"===t.type?(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(ei.Z,{width:1,children:(0,s.jsx)(eb,{processed:t,edit:n})}),(0,s.jsx)(ei.Z,{width:1,children:g(t.index,r&&r.length)}),(0,s.jsx)(ei.Z,{width:1,children:t.recognized?1:0}),(0,s.jsx)(ei.Z,{width:1,children:t.synsets.length}),(0,s.jsx)(ei.Z,{width:1,children:t.related.length})]}):(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(ei.Z,{width:1}),(0,s.jsx)(ei.Z,{width:1}),(0,s.jsx)(ei.Z,{width:1,children:t.matches.length}),(0,s.jsx)(ei.Z,{width:1}),(0,s.jsx)(ei.Z,{width:1})]}),i.map(e=>(0,s.jsx)(ei.Z,{className:"table-cell-input",children:(0,s.jsx)(et.Z,{sx:{textAlign:"right"},fullWidth:!0,onChange:s=>{let r=+s.target.value;r?l.categories[e]=r:delete l.categories[e],n({type:"update",term:t.term,term_type:t.term_type,categories:l.categories})},value:l.categories[e]?l.categories[e]:""})},e))]})}function ek(e){let{processed:t}=e,n=(0,a.useContext)(G),r=(0,a.useContext)(o),[i,l]=(0,a.useState)(0),[c,d]=(0,a.useState)(5),x=t.matches.length,h=[];if(x)for(let e=i*c,n=Math.min(t.matches.length,e+c);e<n;e++)h.push(t.matches[e]);if(!t.common_matches){let e="";t.matches.forEach(t=>{(!e||t.length<e.length)&&(e=t)}),t.common_matches=ev(e,";;"+t.matches.join(";;")+";;")}return(0,s.jsx)(en.Z,{sx:{height:"100%",overflowY:"auto"},children:x?(0,s.jsxs)(el.Z,{sx:{height:"100%"},children:[(0,s.jsxs)(ea.Z,{stickyHeader:!0,size:"small",sx:{width:"100%","& .MuiTableCell-root:first-of-type":{pl:.5},"& .MuiTableCell-root:last-of-type":{pr:.5}},children:[(0,s.jsx)(eo.Z,{children:(0,s.jsxs)(er.Z,{children:[(0,s.jsx)(ei.Z,{width:"999",children:"Match"}),(0,s.jsx)(ei.Z,{align:"right",children:"Frequency"}),(0,s.jsx)(ei.Z,{align:"right",children:"Senses"}),(0,s.jsx)(ei.Z,{align:"right",children:"Related"})]})}),(0,s.jsx)(ec.Z,{children:h.map((e,t)=>{e in n||(n[e]=X(e,r));let i=n[e];return(0,s.jsxs)(er.Z,{sx:{height:33},hover:!0,children:[(0,s.jsx)(ei.Z,{children:(0,s.jsx)(eE,{term:e})}),(0,s.jsx)(ei.Z,{align:"right",children:g(i.index,r.terms&&r.terms.length)}),(0,s.jsx)(ei.Z,{align:"right",children:i.synsets.length}),(0,s.jsx)(ei.Z,{align:"right",children:i.related.length})]},e+t)})})]}),(0,s.jsx)(ed.Z,{component:"div",rowsPerPageOptions:[5,10,50,100,1e3],count:x,rowsPerPage:c,page:i,onPageChange:(e,t)=>{l(t)},onRowsPerPageChange:e=>{d(parseInt(e.target.value)),l(0)}})]}):(0,s.jsx)(O.Z,{children:"No matches"})})}function e_(e){let{processed:t}=e,n={p:1,maxHeight:"100%",overflowY:"auto",overflowX:"hidden"},{terms:r,collapsedTerms:i,sense_keys:l}=(0,a.useContext)(o);return t.forms||(t.forms=ev(t.term,i||""),t.forms.sort(m)),(0,s.jsxs)(A.Z,{direction:"row",spacing:4,sx:{height:"100%"},children:[(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(ee.Z,{title:"100 - index / n terms * 100; terms are losely sorted by frequency and space coverage",children:(0,s.jsx)(O.Z,{children:"Relative Frequency"})}),(0,s.jsx)(en.Z,{sx:{p:1},children:(0,s.jsx)("span",{className:"number",children:g(t.index,r&&r.length)})})]}),t.forms.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(O.Z,{children:"Expanded Forms"}),(0,s.jsx)(en.Z,{sx:n,children:(0,s.jsx)(ex.Z,{sx:{p:0},children:t.forms.map(e=>(0,s.jsx)(eh.ZP,{sx:{p:0},children:(0,s.jsx)(eE,{term:e})},e))})})]}):(0,s.jsx)(s.Fragment,{}),t.related.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(O.Z,{children:"Related Terms"}),(0,s.jsx)(en.Z,{sx:n,children:(0,s.jsx)(ex.Z,{sx:{p:0},children:t.related.map(e=>(0,s.jsx)(eh.ZP,{sx:{p:0},children:(0,s.jsx)(eE,{term:e})},e))})})]}):(0,s.jsx)(s.Fragment,{}),l&&t.synsets.length?(0,s.jsxs)(A.Z,{children:[(0,s.jsx)(O.Z,{children:"Senses"}),(0,s.jsx)(en.Z,{sx:n,children:(0,s.jsx)(ex.Z,{sx:{p:0},children:t.synsets.map(e=>(0,s.jsx)(eh.ZP,{sx:{p:0},children:(0,s.jsx)(ep,{senseKey:l[e.index],info:e})},e.index))})})]}):(0,s.jsx)(s.Fragment,{})]})}function eE(e){let{term:t}=e,n=(0,a.useContext)(eT);return(0,s.jsx)(eu.Z,{underline:"none",sx:{p:0,justifyContent:"flex-start",cursor:"pointer",display:"block"},onClick:()=>n({type:"add",state:{type:"term",value:t}}),children:t})}function eO(e){let{term:t}=e,n=(0,a.useContext)(G),r=(0,a.useContext)(o);t in n||(n[t]=X(t,r));let i=n[t];return"fixed"===i.type?(0,s.jsx)(e_,{processed:i}):(0,s.jsx)(ek,{processed:i})}let eT=(0,a.createContext)(e=>{});function eA(e){let{term:t}=e,n=(0,a.useContext)(U),r=(0,a.useContext)(Y),i=t in n;return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(T.Z,{sx:{overflowY:"auto",pt:0},children:(0,s.jsx)(eO,{term:t})}),(0,s.jsx)(M.Z,{sx:{justifyContent:"flex-end",mt:"auto"},children:(0,s.jsx)(D.Z,{onClick:()=>{r(i?{type:"remove",term:t}:{type:"add",term:t,term_type:"fixed"})},children:i?"Remove":"Add"})})]})}function eF(e){let{info:t}=e;return(0,s.jsx)(T.Z,{sx:{overflowY:"auto",mb:"auto",pt:0},children:(0,s.jsx)(ey,{info:t})})}function eP(e){let{state:t,edit:n}=e;if(!t.length)return;let r=()=>n({type:"reset"}),i=t[0];return(0,s.jsx)(k.ZP,{open:""!==i.value,onClose:r,variant:"permanent",hideBackdrop:!0,anchor:"bottom",sx:{"& .MuiPaper-root":{height:"45vh",display:"flex",flexDirection:"column",justifyContent:"space-between"}},children:(0,s.jsxs)(_.Z,{children:[(0,s.jsx)(E.Z,{action:(0,s.jsx)(S.Z,{"aria-label":"Close",onClick:r,children:(0,s.jsx)(w.Z,{})}),title:(0,s.jsxs)(A.Z,{direction:"row",children:[t.length>1?(0,s.jsx)(D.Z,{onClick:()=>n({type:"back"}),sx:{opacity:.7},children:t[1].value}):(0,s.jsx)(s.Fragment,{}),(0,s.jsx)(O.Z,{variant:"h4",children:i.value})]})}),"term"===i.type?(0,s.jsx)(eA,{term:i.value}):(0,s.jsx)(eF,{info:i.info})]})})}var ez=n(6882),eN=n(8938),eI=n(502),eR=n(9540),eM=n(880),eD=n(6500),eB=n(4989),eW=n(5229),eJ=n(3216),eK=n(8212),e$=n(5843),eH=n(1101),eU=n(9394),eY=n(1797),eq=n(6337),eL=n(2834);let eG=(0,e$.ZP)("input")({clip:"rect(0 0 0 0)",clipPath:"inset(50%)",height:1,overflow:"hidden",position:"absolute",bottom:0,left:0,whiteSpace:"nowrap",width:1}),eV=/\\t/,eX=/^\s+|\s+$/g,eQ=/^"|"$/g,e0=/\s+/g;function e1(e,t){return{added:Date.now(),type:"fixed",categories:e,sense:t||""}}function e5(){let e=(0,eH.Z)(),t=(0,a.useContext)(H),[n,r]=(0,a.useState)(""),[i,l]=(0,a.useState)(!1),o=()=>l(!i),[c,d]=(0,a.useState)(""),x=()=>{r(""),d("")},h=()=>{n&&(t({type:"add",name:n,dict:function(e){let t={};if(e){try{if("%"===e[0]){let n=e.split("\n"),s={},r=n.length;if(r>1){let e=1;for(e=1;e<r;e++){let t=n[e].replace(eX,"");if("%"===t)break;let r=t.split(e0);r.length>1&&(s[r[0]]=r[1])}for(;e<r;e++){let r=n[e].replace(eX,"");if(r.length>1){let e=r.split(e0),n=e.splice(0,1)[0],i={};e.forEach(e=>{e in s&&(i[s[e]]=1)}),t[n]=e1(i)}}}}else if("{"===e[0]){let n=JSON.parse(e);Object.keys(n).forEach(e=>{let s=n[e];Array.isArray(s)?s.forEach(n=>{n in t?t[n].categories[e]=1:t[n]=e1({[e]:1})}):Object.keys(s).forEach(n=>{n in t?t[n].categories[e]=s[n]:t[n]=e1({[e]:s[n]})})})}else{let n=e.split("\n"),s=eV.test(n[0])?"\\t":",",r=n.splice(0,1)[0].split(s).map(e=>e.replace(eQ,""));r.splice(0,1),n.forEach(e=>{let n=e.split(s),i=n.splice(0,1)[0].replace(eQ,""),l={};n.forEach((e,t)=>{e&&(l[r[t]]=+e)}),t[i]=e1(l)})}}catch(e){}console.log(t)}return t}(c)}),x(),o())};return(0,a.useEffect)(()=>{window.addEventListener("drop",e=>{if(e.preventDefault(),e.dataTransfer&&e.dataTransfer.files&&e.dataTransfer.files.length){let t=e.dataTransfer.files[0],s=new FileReader;s.onload=()=>{n||r(b(t.name)),d(s.result)},s.readAsText(t)}})},[n]),(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(D.Z,{variant:"contained",onClick:o,children:"New"}),(0,s.jsxs)(eU.Z,{open:i,onClose:o,children:[(0,s.jsx)(eY.Z,{children:"Add Dictionary"}),(0,s.jsx)(S.Z,{"aria-label":"close",onClick:o,sx:{position:"absolute",right:8,top:12,color:e.palette.grey[500]},children:(0,s.jsx)(w.Z,{})}),(0,s.jsx)(eq.Z,{sx:{p:1},children:(0,s.jsxs)(A.Z,{spacing:1,children:[(0,s.jsx)(et.Z,{size:"small",label:"name",value:n,onKeyDown:e=>{n&&"Enter"===e.code&&h()},onChange:e=>{r(e.target.value)}}),(0,s.jsx)("textarea",{style:{backgroundColor:e.palette.background.default,color:e.palette.text.primary,whiteSpace:"nowrap",minWidth:"30em",minHeight:"20em"},value:c,onChange:e=>{d(e.target.value)},placeholder:"drag and drop a file, enter content directly"})]})}),(0,s.jsxs)(eL.Z,{sx:{justifyContent:"space-between"},children:[(0,s.jsxs)(A.Z,{direction:"row",spacing:1,children:[(0,s.jsxs)(D.Z,{variant:"outlined",component:"label",children:["File",(0,s.jsx)(eG,{type:"file",onChange:e=>{if(e.target.files&&e.target.files.length){let t=e.target.files[0],s=new FileReader;s.onload=()=>{n||r(b(t.name)),d(s.result)},s.readAsText(t)}}})]}),(0,s.jsx)(D.Z,{onClick:x,children:"clear"})]}),(0,s.jsx)(D.Z,{variant:"contained",onClick:h,children:"Add"})]})]})]})}function e2(){let e=(0,eH.Z)(),t=(0,a.useContext)(J),n=(0,a.useContext)($)[t],[r,i]=(0,a.useState)(!1),l=()=>i(!r),[o,c]=(0,a.useState)("csv"),[d,x]=(0,a.useState)(","),[h,u]=(0,a.useState)(t),[j,p]=(0,a.useState)("unweighted"),m=(0,a.useMemo)(()=>(function(e,t,n,s){switch(t){case"csv":let r=Object.keys(e),i=new Set;r.forEach(t=>{let n=e[t].categories;n&&Object.keys(n).forEach(e=>i.add(e))});let l=Array.from(i),a=new Map(l.map((e,t)=>[t,e]));return'"term"'+n+'"'+l.join('"'+n+'"')+'"\n'+r.map(t=>{let s=e[t].categories,r='"'+t+'"';return a.forEach(e=>{r+=n+(e in s?s[e]:"")}),r}).join("\n");case"dic":let o={},c=0,d="";return Object.keys(e).forEach(t=>{let n=e[t].categories;if(n){let e=[t];Object.keys(n).forEach(t=>{t in o||(o[t]=++c),e.push(o[t])}),d+="\n"+e.join("	")}}),"%\n"+Object.keys(o).map(e=>o[e]+"	"+e).join("\n")+"\n%"+d;case"json":if("full"===s)return JSON.stringify(e,void 0,2);let x={};if(Object.keys(e).forEach(t=>{let n=e[t].categories;n&&Object.keys(n).forEach(e=>{e in x||(x[e]={}),x[e][t]=n[e]})}),"weighted"===s)return JSON.stringify(x,void 0,2);let h={};return Object.keys(x).forEach(e=>{h[e]=Object.keys(x[e])}),JSON.stringify(h,void 0,2);default:return""}})(n,o,d,j),[n,o,d,j]);return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(D.Z,{variant:"contained",onClick:l,children:"Export"}),(0,s.jsxs)(eU.Z,{open:r,onClose:l,children:[(0,s.jsx)(eY.Z,{children:"Export Dictionary"}),(0,s.jsx)(S.Z,{"aria-label":"close",onClick:l,sx:{position:"absolute",right:8,top:12,color:e.palette.grey[500]},children:(0,s.jsx)(w.Z,{})}),(0,s.jsx)(eq.Z,{sx:{p:1},children:(0,s.jsxs)(A.Z,{spacing:1,children:[(0,s.jsx)(et.Z,{size:"small",label:"name",value:h,onChange:e=>{u(e.target.value)}}),(0,s.jsx)("textarea",{style:{backgroundColor:e.palette.background.default,color:e.palette.text.primary,whiteSpace:"nowrap",minWidth:"30em",minHeight:"20em"},value:m,onChange:()=>{}})]})}),(0,s.jsxs)(eL.Z,{sx:{justifyContent:"space-between"},children:[(0,s.jsxs)(A.Z,{direction:"row",spacing:1,children:[(0,s.jsxs)(z.Z,{children:[(0,s.jsx)(N.Z,{children:"Format"}),(0,s.jsxs)(I.Z,{label:"Format",size:"small",value:o,onChange:e=>{c(e.target.value)},children:[(0,s.jsx)(R.Z,{value:"dic",children:".dic"}),(0,s.jsx)(R.Z,{value:"json",children:".json"}),(0,s.jsx)(R.Z,{value:"csv",children:".csv"})]})]}),"csv"===o?(0,s.jsx)(et.Z,{sx:{maxWidth:"5em"},size:"small",label:"Separator",value:d,onChange:e=>{x(e.target.value)}}):(0,s.jsx)(s.Fragment,{})," ","json"===o?(0,s.jsxs)(z.Z,{children:[(0,s.jsx)(N.Z,{children:"Type"}),(0,s.jsxs)(I.Z,{label:"Type",size:"small",value:j,onChange:e=>{p(e.target.value)},children:[(0,s.jsx)(R.Z,{value:"weighted",children:"Weighted"}),(0,s.jsx)(R.Z,{value:"unweighted",children:"Unweighted"}),(0,s.jsx)(R.Z,{value:"full",children:"Full"})]})]}):(0,s.jsx)(s.Fragment,{})]}),(0,s.jsx)(D.Z,{variant:"outlined",onClick:()=>{if(h&&m){let e=document.createElement("a");e.setAttribute("href",URL.createObjectURL(new Blob([m],{type:"text/plain"}))),e.setAttribute("download",h+"."+("csv"===o?"	"===d?"tsv":","===d?"csv":"txt":o)),document.body.appendChild(e),e.click(),document.body.removeChild(e)}},children:"Download"})]})]})]})}function e3(){let[e,t]=(0,a.useState)(!1),n=()=>t(!e),r=(0,a.useContext)($),i=(0,a.useContext)(H),l=(0,a.useContext)(J),o=Object.keys(r),c=(0,a.useContext)(q),d=(0,a.useContext)(L),[x,h]=(0,a.useState)(""),u=()=>{x&&-1===c.indexOf(x)&&(d({type:"add",cat:x}),h(""))};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(D.Z,{variant:"text",sx:{fontWeight:"bold"},onClick:n,children:l}),(0,s.jsx)(k.ZP,{anchor:"left",open:e,onClose:n,children:(0,s.jsxs)(_.Z,{sx:{height:"100%",width:"15em",display:"flex",flexDirection:"column",justifyContent:"space-between"},children:[(0,s.jsx)(E.Z,{title:(0,s.jsx)(O.Z,{children:"Dictionary Menu"}),action:(0,s.jsx)(S.Z,{onClick:n,children:(0,s.jsx)(w.Z,{})})}),(0,s.jsxs)(T.Z,{sx:{alignContent:"left",mb:"auto",pt:0},children:[(0,s.jsxs)(A.Z,{direction:"row",sx:{mb:4},children:[(0,s.jsxs)(z.Z,{fullWidth:!0,children:[(0,s.jsx)(N.Z,{children:"Current"}),(0,s.jsx)(I.Z,{label:"Current",size:"small",value:l,onChange:e=>{i({type:"set",name:e.target.value,dict:r[e.target.value]})},children:o.map(e=>(0,s.jsx)(R.Z,{value:e,children:e},e))})]}),(0,s.jsx)(e5,{})]}),(0,s.jsxs)(_.Z,{elevation:3,children:[(0,s.jsx)(E.Z,{title:(0,s.jsx)(O.Z,{children:"Categories"}),sx:{pb:0}}),(0,s.jsx)(T.Z,{sx:{pt:0,pb:0},children:(0,s.jsx)(ex.Z,{sx:{maxHeight:"9em",overflowY:"auto"},children:c.map(e=>(0,s.jsxs)(eh.ZP,{sx:{p:0},children:[(0,s.jsx)(eK.Z,{primary:e}),(0,s.jsx)(S.Z,{"aria-label":"delete category",onClick:()=>{d({type:"remove",cat:e})},children:(0,s.jsx)(eJ.Z,{})})]},e))})}),(0,s.jsx)(M.Z,{children:(0,s.jsxs)(A.Z,{direction:"row",children:[(0,s.jsx)(et.Z,{size:"small",value:x,onKeyDown:e=>{"Enter"===e.code&&u()},onChange:e=>{h(e.target.value)}}),(0,s.jsx)(D.Z,{variant:"contained",onClick:u,children:"Add"})]})})]})]}),(0,s.jsx)(M.Z,{children:(0,s.jsxs)(A.Z,{direction:"column",sx:{width:"100%"},spacing:2,children:[(0,s.jsx)(e2,{}),(0,s.jsx)(D.Z,{fullWidth:!0,color:"error",onClick:()=>{i({type:"delete",name:l})},children:"Delete"})]})})]})})]})}function e9(e){let{terms:t,exists:n,add:r,asTable:i,displayToggle:l,sortBy:c,setSortBy:d}=e,[u,j]=(0,a.useState)(""),[m,g]=(0,a.useState)(!1),[y,v]=(0,a.useState)([]),[b,C]=(0,a.useState)(!1),w=(0,a.useContext)(eT),{collapsedTerms:k}=(0,a.useContext)(o),_=e=>{let t=e?"string"==typeof e?e:"innerText"in e.target?e.target.innerText:u:u;if(t&&!n(t)){if(b){let e=t;try{e=new RegExp(e)}catch(e){}r(e,"regex")}else r(t,"fixed");v([]),j("")}},E=e=>{let t=e.target;if(t&&"value"in t){let e=t.value.toLowerCase();g(n(e)),j(e)}};return(0,s.jsx)(eD.Z,{component:"nav",children:(0,s.jsxs)(eB.Z,{variant:"dense",sx:{justifyContent:"space-between"},disableGutters:!0,children:[(0,s.jsx)(e3,{}),(0,s.jsxs)(A.Z,{direction:"row",sx:{width:"calc(min(500px, 50%))"},spacing:1,children:[(0,s.jsx)(eW.Z,{options:y,value:u,onKeyUp:e=>{if("code"in e&&"Enter"===e.code){let t="value"in e.target?e.target.value:"";t===u&&_(t)}else if(t){let e=[];if(u&&k){let t;try{t=RegExp(b?Z(u):x.test(u)?p(u):";"+u+"[^;]*;","g")}catch(e){t=RegExp(";"+u.replace(h,"\\%&")+";","g")}f(t,k,e,100)}v(e)}},onChange:E,renderOption:(e,t)=>(0,a.createElement)(eh.ZP,{...e,key:t,onClick:_},t),renderInput:e=>(0,s.jsx)(et.Z,{...e,size:"small",placeholder:"term to add",value:u,onChange:E,error:m}),filterOptions:e=>e,selectOnFocus:!0,clearOnBlur:!0,clearOnEscape:!0,handleHomeEndKeys:!0,fullWidth:!0,freeSolo:!0}),(0,s.jsx)(ee.Z,{title:"regular expression characters are "+(b?"active":"escaped"),children:(0,s.jsx)(S.Z,{"aria-label":"toggle regular expression",onClick:()=>C(!b),children:b?(0,s.jsx)(eR.Z,{}):(0,s.jsx)(eM.Z,{})})}),(0,s.jsx)(D.Z,{variant:"outlined",disabled:!u,onClick:()=>{u&&w({type:"add",state:{type:"term",value:u}})},children:"View"}),(0,s.jsx)(D.Z,{variant:"contained",onClick:()=>_(),disabled:!u||m,children:"Add"})]}),(0,s.jsx)(W,{asTable:i,displayToggle:l,sortBy:c,setSortBy:d})]})})}(0,e$.ZP)("a")({clip:"rect(0 0 0 0)",clipPath:"inset(50%)",height:1,overflow:"hidden",position:"absolute",bottom:0,left:0,whiteSpace:"nowrap",width:1});let e8=[{key:"terms",label:"Terms"},{key:"termAssociations",label:"Term Associations"},{key:"sense_keys",label:"Sense Keys"},{key:"synsetInfo",label:"Synset Info"}];function e4(e){let{loading:t,drawerOpen:n}=e,r=(0,a.useContext)(o),i=(0,a.useContext)(U),l=(0,a.useContext)(q),c=(0,a.useContext)(G),d=(0,a.useContext)(Y),x=(0,a.useMemo)(B,[]),[h,u]=(0,a.useState)(!("asTable"in x)||x.asTable),[j,p]=(0,a.useState)(x.sortBy||"time"),m=e=>e in i,g=Object.keys(i).sort("time"===j?(e,t)=>i[e].added-i[t].added:void 0),f=e=>{if(r.termAssociations)return e in c||(c[e]=X("regex"===i[e].type?new RegExp(e):e,r)),c[e]};return(0,s.jsx)(en.Z,{children:r.termAssociations&&r.synsetInfo?(0,s.jsxs)(eN.Z,{children:[(0,s.jsx)(e9,{terms:r.terms,exists:m,add:(e,t)=>{d({type:"add",term:e,term_type:t})},asTable:h,displayToggle:(e,t)=>{x.asTable=t,localStorage.setItem("dictionary_builder_settings",JSON.stringify(x)),u(t)},sortBy:j,setSortBy:e=>{x.sortBy=e.target.value,localStorage.setItem("dictionary_builder_settings",JSON.stringify(x)),p(x.sortBy)}}),(0,s.jsx)(en.Z,{component:"main",sx:{position:"absolute",top:0,right:0,bottom:0,left:0,overflowY:"auto",mt:"3.5em",mb:n?"45vh":0,pr:1,pb:1,pl:1},children:g.length?h?(0,s.jsxs)(ea.Z,{stickyHeader:!0,sx:{"& .MuiTableCell-root":{p:.5,textAlign:"right"},"& th.MuiTableCell-root:first-of-type":{textAlign:"left"}},children:[(0,s.jsx)(eo.Z,{children:(0,s.jsxs)(er.Z,{children:[(0,s.jsx)(ei.Z,{component:"th",children:"Term"}),(0,s.jsx)(ei.Z,{component:"th",children:"Sense"}),(0,s.jsx)(ei.Z,{component:"th",children:"Frequency"}),(0,s.jsx)(ei.Z,{component:"th",children:"Matches"}),(0,s.jsx)(ei.Z,{component:"th",children:"Senses"}),(0,s.jsx)(ei.Z,{component:"th",children:"Related"}),l.map(e=>(0,s.jsx)(ei.Z,{component:"th",children:e},"category_"+e))]})}),(0,s.jsx)(ec.Z,{children:g.map(e=>{let t=f(e);return t?(0,s.jsx)(eS,{processed:t,edit:d},e):(0,s.jsx)(s.Fragment,{})})})]}):g.map(e=>{let t=f(e);return t?(0,s.jsx)(ew,{processed:t,onRemove:()=>{d({type:"remove",term:e})},onUpdate:n=>{n&&!m(n)&&d({type:"replace",term:n,term_type:t.term_type,originalTerm:e})},edit:d},e):(0,s.jsx)(s.Fragment,{})}):(0,s.jsx)(O.Z,{align:"center",children:"Add terms, or import an existing dictionary."})})]}):(0,s.jsxs)(A.Z,{sx:{margin:"auto",marginTop:10,maxWidth:350},children:[(0,s.jsx)(O.Z,{children:"Loading Resources..."}),(0,s.jsx)(ex.Z,{children:e8.map(e=>{let{key:n,label:i}=e;return(0,s.jsx)(eh.ZP,{children:(0,s.jsxs)(O.Z,{children:[r[n]?(0,s.jsx)(ej.Z,{color:"success"}):t[n]?(0,s.jsx)(ez.Z,{size:"1.5rem"}):(0,s.jsx)(eI.Z,{color:"error",sx:{marginBottom:-.8}}),r[n]||t[n]?"":"Failed to load ",i]})},n)})})]})})}let e6=(0,r.Z)({palette:{mode:"dark",primary:{main:"#bb92e3"}}}),e7=(e,t)=>{switch(t.type){case"add":return e.length&&e[0].value===t.state.value?[...e]:[t.state,...e];case"back":return[...e].splice(1,e.length);default:return[]}};function te(){let[e,t]=(0,a.useState)(!0),[n,r]=(0,a.useState)(!0),[o,d]=(0,a.useState)(!0),[x,h]=(0,a.useState)(!0),[u,j]=(0,a.useReducer)(e7,[]);return(0,s.jsx)(a.StrictMode,{children:(0,s.jsxs)(i.Z,{theme:e6,children:[(0,s.jsx)(l.ZP,{}),(0,s.jsx)(c,{loadingTerms:t,loadingTermAssociations:r,loadingSenseKeys:d,loadingSynsetInfo:h,children:(0,s.jsx)(Q,{children:(0,s.jsxs)(eT.Provider,{value:j,children:[(0,s.jsx)(e4,{loading:{terms:e,termAssociations:n,sense_keys:o,synsetInfo:x},drawerOpen:!!u.length}),(0,s.jsx)(eP,{state:u,edit:j})]})})})]})})}}},function(e){e.O(0,[39,971,938,744],function(){return e(e.s=69)}),_N_E=e.O()}]);