#ifndef TEXTURE_H
#define TEXTURE_H

#include <stdio.h>
#include <stdint.h>
#include "defs.h"
#include "upng.h"

#define NUM_TEXTURES 9

typedef struct {
    int width;
    int height;
    color_t* texture_buffer;
    upng_t* upngTexture;
} texture_t;

texture_t wallTextures[NUM_TEXTURES];

void loadWallTextures(void);
void freeWallTextures(void);

#endif
