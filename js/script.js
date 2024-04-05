const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const resultado = document.getElementById('resultado');
const ctxResultado = resultado.getContext('2d');

const inputThreshold = document.querySelector('.input-threshold');
const inputFile = document.querySelector('#inputFile');

const kernelDesenfoque = [
    [1, 1, 1],
    [1, 1, 1],
    [1, 1, 1]
]

const kernelHorizontal = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
];

const kernelVertical = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
];

const filtrosConThreshold = ["sobel"];

function convertToGrayScale() {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = (r + g + b) / 3;

        data[i] = gray;
        data[i + 1] = gray;
        data[i + 2] = gray;
    }

    ctx.putImageData(imageData, 0, 0);
}

function applyConvolution({ kernel, threshold }){
    const mitadKernelX = Math.floor(kernel.length / 2);
    const mitadKernelY = Math.floor(kernel[0].length / 2);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const dataConsulta = [...data];

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            let suma = 0;
            for (let i = -mitadKernelY; i < kernel.length - mitadKernelY; i++) {
                for (let j = -mitadKernelX; j < kernel[0].length - mitadKernelX; j++) {
                    const pixel = dataConsulta[((y + j) * canvas.width + (x + i)) * 4];
                    suma += pixel * kernel[i + 1][j + 1];
                }
            }

            let divisor = 1;
            kernel.forEach(row => divisor += row.reduce((acc, ac) => acc + ac));
            let promedio = suma / (divisor || 1);

            if(threshold && promedio > 200) promedio = 255;

            data[(y * canvas.width + x) * 4] = promedio;
            data[(y * canvas.width + x) * 4 + 1] = promedio;
            data[(y * canvas.width + x) * 4 + 2] = promedio;
        }
    }

    ctxResultado.putImageData(imageData, 0, 0);
}

function applySobel(threshold = 100) {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const dataConsulta = [...data];

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
            let magX = 0;
            let magY = 0;
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    const pixel = dataConsulta[((y + j) * canvas.width + (x + i)) * 4];
                    magX += pixel * kernelHorizontal[i + 1][j + 1];
                    magY += pixel * kernelVertical[i + 1][j + 1];
                }
            }

            let magnitud = Math.sqrt(magX**2 + magY**2);
            let angulo = Math.atan2(magY, magX);

            //? Para que las líneas se pinten del mismo color si van en el mismo sentido
            if(angulo < 0) angulo += Math.PI;

            //? Mostrar los ejes del mismo color (escala de grises)
            // data[(y * canvas.width + x) * 4] = magnitud;
            // data[(y * canvas.width + x) * 4 + 1] = magnitud;
            // data[(y * canvas.width + x) * 4 + 2] = magnitud;

            //? Usar colores para mostrar las líneas
            if (magnitud > threshold) {
                let hue = (angulo - Math.PI/2) * 180 / Math.PI;
                ctxResultado.fillStyle = `hsl(${hue}, 100%, 50%)`;
                ctxResultado.fillRect(x, y, 1, 1);
            }
        }
    }

    //? Mostrar la imagen en escala de grises
    // ctxResultado.putImageData(imageData, 0, 0);
}

const imagen = new Image();
// imagen.src = '/img/persona.webp';
// imagen.src = '/img/prueba.png';
imagen.src = '/img/imagen.jpg';
let filtro = "sobel";
let threshold = 100;

function applyFilter(){
    const imageRatio = imagen.width / imagen.height;
    ctx.drawImage(imagen, 0, (canvas.height - canvas.height/imageRatio)/2, canvas.width, canvas.height/imageRatio);
    ctxResultado.fillStyle = 'black';
    ctxResultado.fillRect(0, 0, resultado.width, resultado.height);

    // Convertir la imagen a escala de grises para poder aplicar los filtros
    convertToGrayScale();

    // Aplicar el filtro seleccionado
    switch(filtro){
        case "sobel":
            applySobel(threshold);
            break;
        case "desenfoque":
            applyConvolution({
                kernel: kernelDesenfoque,
                threshold: 100
            });
            break;
        case "horizontal":
            applyConvolution({
                kernel: kernelHorizontal,
                threshold: 100
            });
            break;
        case "vertical":
            applyConvolution({
                kernel: kernelVertical,
                threshold: 100
            });
            break;
    }
}

imagen.onload = () => {
    canvas.width = canvas.width;
    applyFilter();
}

document.addEventListener('click', e => {
    if(e.target.matches("button.filtro")){
        filtro = e.target.dataset.filtro;

        // Deshabilitar el threshold si el filtro no lo necesita
        inputThreshold.disabled = !filtrosConThreshold.includes(filtro);

        applyFilter();
    }
    if(e.target.matches(".imagenes img")){
        imagen.src = e.target.src;
    }
});

inputThreshold.addEventListener('input', e => {
    threshold = e.target.value;
    e.target.dataset.value = e.target.value;
    applyFilter();
});

inputFile.addEventListener('change', e => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = e => {
        imagen.src = e.target.result;
    }

    reader.readAsDataURL(file);
})