const {spawn} = require('child_process');
const mongoose = require('mongoose');
//const config = require('../db');
const path = require('path');
const ObjectId = mongoose.Schema.Types.ObjectId;

let metricSchema = new mongoose.Schema({

    submissionId: {
        type: String,
        require: true
    },

    filename: {
        type: String,
        require: true
    },
    dog_x: {
        type: Number,
        require: true
    },
    human_x: {
        type: Number,
        require: true
    },
    human_y: {
        type: Number,
        require: true
    },
    bee_x: {
        type: Number,
        require: true
    },
    bee_y: {
        type: Number,
        require: true
    },
    UV_x: {
        type: Number,
        require: true
    },
    UV_y: {
        type: Number,
        require: true
    },
    UV_z: {
        type: Number,
        require: true
    },
    VIS_x: {
        type: Number,
        require: true
    },
    VIS_y: {
        type: Number,
        require: true
    },
    VIS_z: {
        type: Number,
        require: true
    }
});

let Metric;

metricSchema.statics.fromRawFile = async function (uploadSet,rawFolderPath) {
    let rPath = path.dirname(__dirname) + '/helpers/MetricCalculation.R';
    let childProcess = spawn('Rscript', [
        '--vanilla',
        path.dirname(__dirname) + '/helpers/MetricCalculation.R',
        rawFolderPath

    ]);
    console.log("Invoking R script... at:"+ rPath );
    let result = JSON.parse(await new Promise((resolve, reject) => {
        let err = '';
        let json = '';

        childProcess.stdout.on('data', data => {
            
            json += data;
        });

        childProcess.stderr.on('data', data => {
            err += data;
        });

        childProcess.on('close', code => {
            if (code !== 0) {
                console.warn(`Rscript process finished with exit code ${code}. stderr output: ${err}`);
            }

            try {
                resolve(json.substr(json.indexOf('{')));
            } catch (e) {
                reject(e);
            }
        })
    }));

    let metrics = [];
    for (let i = 0; i < result.metrics.dog_x.length; i++) {
        let m = {
            submissionId: uploadSet.submission._id,
            filename: result.filesName[i]
        };
        for (let k in result.metrics) {
            m[k] = result.metrics[k][i];
        }

        metrics.push(new Metric(m));
        
    }
    //console.log(metrics);
    return {
        ...result,
        metrics: metrics,
        
    };
};

module.exports = Metric = mongoose.model('Metric', metricSchema);
