var dropHandler;


function dragOverHandler(ev) {
    console.log('File(s) in drop zone');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();
}

var pixels = 28;
var image_size = pixels*pixels;


canvas = document.getElementById('canvas');
canvas.onmousemove = function(click) {
	console.log("button " + click.buttons);
	if(click.buttons == 0) return;
    var ctx = canvas.getContext('2d');
    
    // get current raster data
    w = canvas.width;
    h = canvas.height;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
    x = click.offsetX;
    y = click.offsetY;
    // x = Math.floor(click.offsetX/w*pixels);
    // y = Math.floor(click.offsetY/h*pixels);
    console.log(x);
    console.log(y);
    // image[x][y] = 255 - image[x][y];

    function at(x, y) {
        index = y*canvas.width*4 + x*4;
        return [data[index], data[index+1], data[index+2]];
    };

    function set(x, y, r, g, b) {
        index = y*canvas.width*4 + x*4;
        data[index] = r;
        data[index+1] = g;
        data[index+2] = b;
    };

    // prepare data
    // data[100*4 + 100*w*4] = 100;
    console.log('set pixel');
    for(var i = 0; i < w; i++) for(var j = 0; j < h; j++) {
        val = Math.random() * 255;
        // index = j*w*4 + i*4;
        index = i*4+ j*w*4;
        // data[i] = val;
        if(index < data.length)
            data[index+3] = 255;
        // set(i, j, val, val, val);
    }

	for(var i = 0; i < w; i++) for(var j = 0; j < h; j++) {
		index = i*4 + j*w*4;
		if((i-x)*(i-x) + (j-y)*(j-y) < 200) {
			data[index] = 255;
			data[index+1] = 255;
			data[index+2] = 255;
		}
	}

    /*for(var i = 0; i < w; i++) for(var j = 0; j < h; j++) {
        // val = Math.random() * 255;
        val = image[Math.floor(i/w*pixels)][Math.floor(j/h*pixels)];
        // index = j*w*4 + i*4;
        index = i*4+ j*w*4;
        // data[i] = val;
        if(index < data.length) {
            data[index] = val;
            data[index+1] = val;
            data[index+2] = val;
        }
        // set(i, j, val, val, val);
    }*/

    // draw newly modified pixels back onto the canvas
    ctx.putImageData(imageData, 0, 0);
};

result = document.getElementById('result')
function say(text) {
	result.innerHTML = text
}

document.getElementById('clear').onclick = function(event) {
    var ctx = canvas.getContext('2d');
    
    // get current raster data
    w = canvas.width;
    h = canvas.height;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;


	for(var i = 0; i < w; i++) for(var j = 0; j < h; j++) {
		index = i*4 + j*w*4;
		data[index] = 0;
		data[index+1] = 0;
		data[index+2] = 0;
	}

    ctx.putImageData(imageData, 0, 0);
};

function get_data() {
    var ctx = canvas.getContext('2d');
    
    // get current raster data
    w = canvas.width;
    h = canvas.height;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var data = imageData.data;
	image = []
	for(var i = 0; i < pixels; i++) {
	    row = [];
	    for(var j = 0; j < pixels; j++) {
	    	row.push(0);
	    }
	    image.push(row);
	}
    for(var i = 0; i < w; i++) for(var j = 0; j < h; j++) {
        index = i*4+ j*w*4;
        image[Math.floor(i/w*pixels)][Math.floor(j/h*pixels)] += data[index] * image_size/w/h;
    }
    console.log(image);
    return image;
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

var Module = {
    onRuntimeInitialized: function () {
        function parse_np(buf) {

            function get(i) {
                slice = buf.slice(0, i);
                buf = buf.slice(i);
                return slice;
            }
            shape = new Int32Array(get(16));
            alpha = shape[0];
            size = shape[1];
            n = shape[2];

        	al = Math.min(document.getElementById('alpha').valueAsNumber, alpha)

            console.log(alpha + " " + size + " " + n)
            console.log(buf.byteLength)
            mat_data = new Float64Array(get(alpha * size * 8));
            images_data = new Uint8Array(get(n * size));
            labels_data = new Int32Array(get(n * 4));

            mat = new Module.EigenMatrix(size, al);
            for(i = 0; i < size; ++i) for(j = 0; j < al; ++j) {
                mat.set(i, j, mat_data[i*alpha + j]);
            }

            images = new Module.EigenMatrix(n, size);
            for(i = 0; i < n; ++i) for(j = 0; j < size; ++j) {
                images.set(i, j, images_data[i*size + j]);
            }

            labels = new Module.EigenIVector(n);
            for(i = 0; i < n; ++i) {
                labels.set(i, labels_data[i]);
            }

            return {
                pca: Module.PCA.from_proj(al, mat),
                images: images,
                labels: labels
            };
        }

        function todo(pca, images, labels, k, pesos) {
            knn = new Module.KNNClassifier(k, pesos);
            knn.fit(pca.transform(images), labels);

            console.log("KNN done");
            say('loaded. draw a digit and then click \'predict\'');

            document.getElementById('predict').onclick = function(event) {
                data = new Module.EigenMatrix(1, image_size);
                image = get_data();
                for(var i = 0; i < pixels; ++i) for(var j = 0; j < pixels; ++j) {
                    data.set(0, i + pixels*j, image[i][j]);
                }
                res = knn.predict(pca.transform(data)).get(0);
                // document.getElementById('result').innerHTML = result.toString();
			    function sleep(ms) {
			       return new Promise(resolve => setTimeout(resolve, ms));
			    }
                say('thinking')
                sleep(500).then(() => {
	                say('thinking.')
	                sleep(500).then(() => {
	                	say('thinking..')
	                	sleep(500).then(() => {
	                		say('thinking...')
		                	sleep(500).then(() => {
		                		say('predicted a ' + res.toString())
		                	})
	                	})
	                })
                })
            };
        }

        function rest(pca, images, labels) {
        	/*function update(k, pesos) {
        		new_pca = new Module.EigenMatrix(image_size, alpha)
        		proj = pca.get_projection();
        		for(i = 0; i < alpha; ++i) for(j = 0; j < image_size; ++j) {
        			new_pca.set(j, i, proj.get(j, i))
        		}
        		rest(Module.PCA.from_proj(alpha, new_pca), images, labels, k, pesos)
        	}*/
			k = document.getElementById('k').valueAsNumber
    		pesos = document.getElementById('pesos').checked
        	todo(pca, images, labels, k, pesos)
    		/*k = document.getElementById('k')
    		pesos = document.getElementById('pesos')

        	document.getElementById('retrain').onclick = function() {
        		update(alpha.valueAsNumber, k.valueAsNumber, pesos.checked)
        	}*/
        }

		function process_inner_blob(blob) {
            data = parse_np(blob);
            pca = data.pca;
            rest(pca, data.images, data.labels);
		}

        function get_blob(click) {
        	say('loading...')
			var oReq = new XMLHttpRequest();
			oReq.open("GET", "trained.txt", true);
			oReq.responseType = "arraybuffer";

			oReq.onload = function (oEvent) {
			  var arrayBuffer = oReq.response; // Note: not oReq.responseText
			  if (arrayBuffer) {
			    var byteArray = new Uint8Array(arrayBuffer);

			    process_inner_blob(arrayBuffer);
			  } else {
			  	say('failed');
			  }
			};
			oReq.send(null);
		}

		document.getElementById('fetch').onclick = get_blob;

        function process_blob(file) {
        	say('loading...')
            file.arrayBuffer().then(blob => {
            	process_inner_blob(blob);
            });
        }

        function process_file(file) {
        	say('loading...')

            file.arrayBuffer().then(blob => {
                // console.log(text)
                lines = text.split(/\r?\n/);
                lines.shift();
                shuffleArray(lines);
                used = lines.length;
                if(used > 5000) {
                    used = 5000;
                }
                var images = new Module.EigenMatrix(used, image_size);
                var labels = new Module.EigenIVector(used);
                for(i = 0; i < used; ++i) {
                    // console.log(lines[i+1]);
                    values = lines[i].split(',') // parser de CVS caserito
                    if(values.length != image_size + 1) console.log(lines[i].length);
                    for(j = 0; j < image_size; ++j) images.set(i, j, parseFloat(values[j+1]));
                    labels.set(i, parseInt(values[0]));
                }

                console.log("running PCA");

                PCA = new Module.PCA(100);
                PCA.fit(images);

                console.log("PCA done");
                console.log("running KNN");

                rest(PCA, images, labels);
            });
        }
        /*document.getElementById('pca').dropHandler = function(ev) {
            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();

            files = []
            if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        var file = ev.dataTransfer.items[i].getAsFile();
                        files.push(file)
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                    files.push(ev.dataTransfer.files[i])
                }
            }
            if(files.length == 1) process_file(files[0]);
        }*/
        document.getElementById('knn').dropHandler = function(ev) {
            // Prevent default behavior (Prevent file from being opened)
            ev.preventDefault();

            files = []
            if (ev.dataTransfer.items) {
                // Use DataTransferItemList interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.items.length; i++) {
                    // If dropped items aren't files, reject them
                    if (ev.dataTransfer.items[i].kind === 'file') {
                        var file = ev.dataTransfer.items[i].getAsFile();
                        files.push(file)
                    }
                }
            } else {
                // Use DataTransfer interface to access the file(s)
                for (var i = 0; i < ev.dataTransfer.files.length; i++) {
                    files.push(ev.dataTransfer.files[i])
                }
            }
            if(files.length == 1) process_blob(files[0]);
        }
        console.log(image_size);
        //vec = new Module.EigenMatrix(4, image_size)
        /*arr = []
        for(i = 0; i < 1000; ++i) {
            for(j = 0; j < image_size; ++j) {
                arr.push(0)
                //vec.set(i, j, 100);
            }
        }
        vec = Module.EigenMatrix.fromArray(arr, [1000, image_size]);
        for(i = 0; i < 1000; ++i) {
            for(j = 0; j < image_size; ++j) {
                //arr.push(0)
                // console.log(i + " -- " + j + "\n");
                vec.set(i, j, 1000);
            }
        }
        console.log('vector at index: ' + vec.get(5, 5));*/
    }
};
