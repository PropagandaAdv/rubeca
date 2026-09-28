zone() { # t x y w h (fractions) label
  ffmpeg -loglevel error -ss $1 -i hero-v2-raw.mp4 -frames:v 1 -vf "crop=iw*$4:ih*$5:iw*$2:ih*$3,format=rgb24" -f rawvideo - | node -e "
const c=[];process.stdin.on('data',d=>c.push(d)).on('end',()=>{const b=Buffer.concat(c);const f=v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4};let w=0;for(let i=0;i<b.length;i+=3){const L=0.2126*f(b[i])+0.7152*f(b[i+1])+0.0722*f(b[i+2]);if(L>w)w=L}console.log('$6 t=$1', 'bianco vs pixel peggiore (senza scrim):',(1.05/(w+0.05)).toFixed(1)+':1')})"
}
for t in 0 0.6 1.1; do zone $t 0.02 0.17 0.5 0.3 banda1; done
for t in 1.3 1.9 2.4; do zone $t 0.02 0.17 0.5 0.3 banda2; done
for t in 2.55 3.1 3.7; do zone $t 0.02 0.17 0.5 0.3 banda3; done
for t in 4.0 4.5 5.0; do zone $t 0.02 0.12 0.62 0.38 finale-headline; done
for t in 4.0 4.5 5.0; do zone $t 0.02 0.57 0.48 0.2 finale-sottotitolo; done
