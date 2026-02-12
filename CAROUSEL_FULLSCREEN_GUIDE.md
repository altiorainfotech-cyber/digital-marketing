# Carousel Fullscreen Preview Guide

## Overview
The fullscreen preview now fully supports CAROUSEL assets, allowing users to navigate through multiple images and videos in an immersive fullscreen experience.

## Features

### 1. Carousel Navigation
- **Arrow Buttons**: Large left/right arrows on the sides for easy navigation
- **Keyboard Support**: Use arrow keys to navigate between slides
- **Thumbnail Bar**: Click any thumbnail to jump directly to that slide
- **Slide Counter**: Shows current position (e.g., "3 / 5")

### 2. Mixed Content Support
- **Images**: Full zoom controls (50% - 200%)
- **Videos**: Autoplay with full controls
- Seamlessly switch between image and video slides

### 3. User Interface

#### Header Bar (Top)
```
[Asset Title]                    [Zoom Out] [100%] [Zoom In] | [Download] [Close]
```
- Title of the carousel asset
- Zoom controls (only visible when viewing image slides)
- Download button (downloads the entire carousel)
- Close button (or press ESC)

#### Main Content Area (Center)
```
[<]                    [Current Slide Content]                    [>]
     (Previous)                                                (Next)
```
- Large navigation arrows on left and right
- Current slide displayed in center
- Images are zoomable
- Videos autoplay with controls

#### Bottom Bar
```
                        [Slide Counter: 3 / 5]
                    [Thumbnail Navigation Bar]
            [Thumb 1] [Thumb 2] [Thumb 3*] [Thumb 4] [Thumb 5]
```
- Slide counter shows current position
- Thumbnail bar for quick navigation
- Current slide highlighted with blue border
- Scroll horizontally if many slides

### 4. Interaction Guide

#### Opening Fullscreen
1. Go to a carousel asset detail page
2. Click "View Fullscreen" button in Preview section
3. Fullscreen modal opens with first slide

#### Navigating Slides
- **Click arrows**: Left/right arrows on screen
- **Keyboard**: Left/right arrow keys
- **Thumbnails**: Click any thumbnail to jump to that slide
- **Touch**: Swipe left/right (on touch devices)

#### Zooming (Images Only)
- **Zoom In**: Click "Zoom In" button or use zoom controls
- **Zoom Out**: Click "Zoom Out" button
- **Range**: 50% to 200%
- **Note**: Zoom resets when switching slides

#### Closing
- **Close Button**: Click X button in top-right
- **ESC Key**: Press ESC on keyboard
- **Click Outside**: Click on dark background area

### 5. Asset Type Specific Behavior

#### Image Slides
```
- Displayed centered and contained
- Zoom controls available
- High-quality rendering
- Smooth zoom transitions
```

#### Video Slides
```
- Autoplay when slide becomes active
- Full video controls (play, pause, volume, fullscreen)
- Optimized size (85vw x 85vh max)
- Video pauses when navigating away
```

### 6. Responsive Design

#### Desktop
- Large arrow buttons on sides
- Full thumbnail bar visible
- Optimal spacing and sizing

#### Tablet
- Medium-sized controls
- Scrollable thumbnail bar
- Touch-friendly buttons

#### Mobile
- Compact controls
- Horizontal scroll for thumbnails
- Touch gestures supported

## Example Scenarios

### Scenario 1: Marketing Campaign Carousel
```
Asset: "Summer Campaign 2024"
Items: 5 images + 2 videos
User: SEO Specialist

1. Opens asset detail page
2. Clicks "View Fullscreen"
3. Reviews all 7 items in fullscreen
4. Zooms into image #3 to check text clarity
5. Watches video #6 in fullscreen
6. Downloads entire carousel
7. Closes with ESC key
```

### Scenario 2: Product Photo Carousel
```
Asset: "Product XYZ Photos"
Items: 10 product images
User: Content Creator

1. Opens fullscreen preview
2. Uses arrow keys to quickly browse all images
3. Clicks thumbnail #5 to jump to specific angle
4. Zooms to 200% to check product details
5. Navigates to next image with arrow
6. Downloads for use in content
```

### Scenario 3: Mixed Media Carousel
```
Asset: "Tutorial Series"
Items: 3 intro images + 4 tutorial videos + 2 outro images
User: Admin

1. Opens fullscreen to review content
2. Views intro images (slides 1-3)
3. Watches tutorial videos (slides 4-7)
4. Reviews outro images (slides 8-9)
5. Uses thumbnails to jump back to video #2
6. Approves content quality
```

## Technical Implementation

### Component Structure
```typescript
FullscreenPreviewModal
├── Header Bar
│   ├── Title
│   ├── Zoom Controls (conditional)
│   ├── Download Button
│   └── Close Button
├── Main Content Area
│   ├── Previous Arrow Button
│   ├── Current Slide Display
│   │   ├── Image (with zoom)
│   │   └── Video (with controls)
│   └── Next Arrow Button
└── Bottom Bar
    ├── Slide Counter
    └── Thumbnail Navigation
        └── Thumbnail Buttons (scrollable)
```

### State Management
```typescript
- zoom: number (50-200)
- currentCarouselIndex: number (0 to items.length-1)
- isOpen: boolean
```

### Props
```typescript
interface FullscreenPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType: AssetType;
  publicUrl: string;
  storageUrl: string;
  title: string;
  mimeType?: string;
  onDownload?: () => void;
  carouselItems?: CarouselItem[]; // For carousel assets
}
```

## User Permissions

### All Roles Can:
- ✅ View carousel in fullscreen
- ✅ Navigate through all slides
- ✅ Zoom images
- ✅ Play videos
- ✅ Download carousel

### Permission Check:
- Uses existing asset visibility rules
- If user can view asset detail page → can use fullscreen
- No additional permissions needed

## Browser Compatibility

### Supported Browsers:
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### Features:
- ✅ Video autoplay
- ✅ Keyboard navigation
- ✅ Touch gestures
- ✅ Smooth transitions
- ✅ Responsive design

## Troubleshooting

### Issue: Carousel items not loading
**Solution**: Check R2_PUBLIC_URL environment variable is configured

### Issue: Videos not playing
**Solution**: Check browser autoplay policies and CORS settings

### Issue: Thumbnails not visible
**Solution**: Verify carousel items have valid publicUrl values

### Issue: Zoom not working
**Solution**: Zoom only works for image slides, not videos

### Issue: Navigation arrows not appearing
**Solution**: Arrows only show when carousel has 2+ items

## Future Enhancements

### Potential Features:
- [ ] Swipe gestures for mobile
- [ ] Keyboard shortcuts (numbers to jump to slides)
- [ ] Slideshow autoplay mode
- [ ] Fullscreen API integration
- [ ] Image comparison mode
- [ ] Annotation tools
- [ ] Share specific slide

## Summary

The carousel fullscreen preview provides a professional, immersive viewing experience for multi-item assets. All users can easily navigate, zoom, and review carousel content in fullscreen mode, making it perfect for reviewing marketing campaigns, product galleries, and mixed media collections.
