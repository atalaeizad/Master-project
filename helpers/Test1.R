
library(pavo)
library(rjson)

filePath <- commandArgs(trailingOnly = TRUE)[1]
spectra <- getspec(where = filePath, ext = 'Master.Transmission')


files = colnames(spectra)
files = files[files != "wl"]

errors <- vector(mode = "list")
warnings <- vector(mode = "list")

for (i in 1 : nrow(spectra)) {
    # row already exists as a fxn!
    row <- spectra[i,]

    for (file in files) {
        full_name <- paste(file, '.Master.Transmission', sep = '')
        val = row[[file]]

        if (val >= - 2 && val <= 0) {
            warnings <- append(warnings, list(list(
            file = full_name,
            wavelen = row$wl,
            value = val)))
        } else if (val < - 2) {
            errors <- append(errors, list(list(
            file = full_name,
            wavelen = row$wl,
            value = val)))
        }
    }
}

fullName = vector(mode = "list")
for (i in 1 : length(files)) {
    fullName[i] = paste(files[i], '.Transmission', sep = '')
}

corrupt <- vector(mode = "list")

for (file in list.files(filePath, pattern = '.Master.Transmission')) {
    if (! (file %in% fullName)) {
        corrupt <- c(corrupt, file)
    }
}
originalName = list.files(filePath, pattern = '.Master.Transmission')
spectra <- procspec(spectra, fixneg = 'addmin', opt = 'smooth', span = 0.1)
# Dog visual system

spectra_dog <- vismodel(spectra, visual = 'canis', illum = 'ideal', scale = 10000)
dog_x <- colspace(spectra_dog, space = 'di')[,'x']
names(dog_x) <- 'dog_x'

# Human visual system

spectra_human <- vismodel(spectra, visual = 'cie2', vonkries = T, relative = F,
                          illum = 'ideal', scale = 10000)
human_xy <- colspace(spectra_human, space = 'ciexyz')[,c('x','y')]
names(human_xy) <- c('human_x', 'human_y')

# Bee visual system

spectra_bee <- vismodel(spectra, visual = 'apis', relative = F, qcatch = 'Ei', 
                        vonkries = T, illum = 'ideal', scale = 10000)
bee_hex <- colspace(spectra_bee, space = 'hex')[,c('x','y')]
names(bee_hex) <- c('bee_x','bee_y')

# For a generic bird visual system that is sensitive to UV

spectra_UVbird <- vismodel(spectra, visual = 'avg.uv', illum = 'ideal', scale = 10000)
UVbird_xyz <- colspace(spectra_UVbird)[,c('x','y','z')]
names(UVbird_xyz) <- c('UV_x', 'UV_y', 'UV_z')


# For a generic bird visual system that is NOT sensitive to UV
spectra_VISbird <- vismodel(spectra, visual = 'avg.v', illum = 'ideal', scale = 10000)
VISbird_xyz <- colspace(spectra_VISbird)[,c('x','y','z')]
names(VISbird_xyz) <- c('VIS_x', 'VIS_y', 'VIS_z')

Metrics <- as.data.frame(cbind(dog_x,human_xy,bee_hex, UVbird_xyz, VISbird_xyz))
write.csv(Metrics, file.path(filePath, 'Temporary_Metrics_file.csv'))

cat(toJSON(list(
files = originalName,
# add metrics
metrics = Metrics,
warnings = warnings,
errors = errors,
corrupt = corrupt
)))