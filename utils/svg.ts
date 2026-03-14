// SVG generation utilities for text-based overlays and labels
// Fonts are embedded inline as base64 data URLs to ensure consistent rendering
// in serverless environments (Netlify functions) where system fonts may not be available.

import sharp from 'sharp'

/**
 * Subset of DejaVu Sans Bold containing only the characters needed for overlays: x0123456789
 * Generated with: pyftsubset DejaVuSans-Bold.ttf --text="x0123456789" --flavor=woff2
 * Original font: DejaVu Sans Bold (license: https://dejavu-fonts.github.io/License.html)
 */
const OVERLAY_FONT_BASE64 =
    'd09GMgABAAAAAA7sABEAAAAAGDAAAA6OAAJeuAAAAAAAAAAAAAAAAAAAAAAAAAAAGhYbIByBFgZWADwIhFQJgSwRDAqQFI4zATYCJAMwCxoABCAFg34HIAyPJxsLFqORMWwcsJ8hixR/cZCJyKA3zHJs2fGWCS1EKy1Ey18tL8t699/p8sX77OvbNc0Jv3SqlRGSzMLzfJ1f5+KVUhXqt9IDKMMl7KWwo/5+lBGWvRpCOaI5/y+ZLBISchGHJEiCWS3UgmioeKDgCTUJ1Kggz1BL1ShNRfHftE6dUpeUir68/IPniUOFdz9rWzC6NtDicGh0bKp50QtSwE6dmmG5gIyu89KjZa3BBSwIZDU7eTT1/5vW7J+r81Abas7lqDm6kCiPMT+FvD87Wy5Lm9DvOj1LzdGaUQhTmsUNPUfNUWqzCIe657EOaVAIZ9AhUwIq9Vx6Vhnbopu4Z5AKkMrMzl1rgQA5I1JEZKmPsDKGSK6y0y4JUzE7HGA+iPdRY66hDk7wd6wqE8vRCdcNYhogt7G04cKQeCcXO1qTyJtOzuFVkjwg4yAYkNoAul2jzU+fewboIFUMFTZNkdZNxzecNk8wROSlTfZEiyHPlcWv13YQhI1CM5iMR4Ntb5CtLDAtJWaRqzogNIO6+7FRWkxGICsizv9NMcQL5AWSqTAe0wQQg8LqLBLioS3CHpn8+n73/KV5Lf9DybESItm08w5MtmEbFpNCRjlWst3lM5mK2SUy/arA/2w5Yi3wHZCrWOe9YNq8EZksoUmXxN92mlfoOlIeYkNSPItmNuX3cEY+B6Uq0fgCH+2HvcA4PpXr2WWI0SaVesM3eJ5fE3S69CqS4LlkYhgkXtwsqapIEUqH9tKjRXysGGRkuLxx+ppkIi2nX65UeUK+SoBo5HCUfiIUaWugQ3WoDMgbCaGJG6YJVG6hUli0vJ1eXkH/Fb1jciyVoU99tIozPKO/q8M4UcjAyPwmR9Rn9rRjmHkm5Gm6iBO7eLb+XiZFuqtoEzchy6XrIjUpqdbr6X7eizHbCLs528hEuM0n4/AfSgzckz6LsmWlp3+oPDC+1TN6Unvp5BF9YJyoyZqnBh5Jq5wWFhiXSqunx5kuxhAZXMOAhbbihvaKQSZahUr5nURB/HQbfrQESfc99IAxCT2CydI4PmLRIPFxEXvAbDPy4IDxlGAu370DwSSJRjS4h23CLGQ913pnkZX0qtIy2eCqWjmpgNSfh/NWPvqj/i97EjeS5XFao2qSRnYh0cXPdxJdvylbmRGbaKSvlJ0cnE/UUMQo0YicjCC3M1Lkbs8SevYDUtfxYxfJMypSeBSVHrmFUzQVZ3YPOqOIOvyE4uIohDJdulGWNVtWgpe4hU7X14X6GcUwlASdzwGPG9EF1SSUcZpzL4lwlS0uKVlR47zF+jwv9dYAh3EujGndAasv9uyL72Qlr2rha6XSN44rfJmXfW5FXxTlnx1Etz3csgq7QutnMch107/RTypgaN0bSsuh/CPyVV5fX6r+MC95fV/o+4u3LKRKvkf8gM6eTV9V2JQ009zKdnZNHXn0BXxW/lRGwErLzVzywYUnke/MUP83rDSgeKrS185msyLPK2d05IB2zicFPT84WdnHUvDGQflrFPbbLrff7dv0+elqW9HCnRRPwrlC7+mkufTEg+h4zJ5DS9LQQp+bBY8vV6+e81LQn/NmdZ6x5/P1Y2sUHlyfwz0Uf3G3T/bns8kxNkkxCy9PpXI8x4mqxaPFsqexYVFrIueUrctN6ktYqY4t8P7/cBXN88OtVWtuXjSWjtwub1Bs6K5/POV1tP61+6e717yht4c9NG+bk5W9a/Z2w++f6vKklOnFKWtTOrxSPEVLpE+kr26yzu6i4l0JAe5NOxfvokBrS2sf/xd/xRviI+j1fR3ikjdtGlogMwD//n9iKtb9nq4KClgZdT8qo2zLP7nLtvxdNqXNe57v6JdPddrCoiKao8sefQu5VzgX393eE1u6OhltYYHNgTNfCar3Pu9kdm5j/pmzNGdX1Kwe6cauvk93z/1q/XbNOX0t6sL6+frchQv1OfPnLclZuAgZitb+7Vm8d12H8CyzKTR1rivZ20xp9DK0Vz1W/LkOPJ8/rmqkfTknZqYlJ2WkJSZmpCYl07OOuSLrzfTe7T25pasTb4sIag5KeiWo3P+ydbF1H1s8e2nurug5XZK1H3W6wqJCXVEGOirCD+y7hz8+qnbZ2S/Vb9R5tbLbtj37v4zfGXmDGRhMG2lLBWatxUpTF17Oj3h1jgC3fmsVhOGffocPBKq41urke0J5jN2T2nUjkWHdQCpVXzWZTYtVwLfBI79t/vJeODvyjvC6zgj5JAhwvKriMKsvOnavCloIKyftFklchl71odpIn7r/KQzmqzZPNFlvZiqVTKVEF/ppA9VTNLZ4+WONr7TFw8cDXEW1Uvlr8rz5AJQ7QdDh8wWumGvHVTAUG9oZKgjH4kN0ZxdBJYWUqQ/cWSNtyA4VLZHshoX7h7PGfcsXo6Y12mwhB8N7PAXOA2lTKrOXrIFbPzVZ3TazlEyWUql8mHV+6cRvA/iAMlAlE5cCCpYaFBOgFN8TSHZ5Ssoz+pGd580y/u+ro0zmYC3o0wqWRZYOc/xjkpi6uu3o+v6steyG2vXN7LEOF+R7KS+axuYKqdOmSsHH+EOTlQkfMH7+NYWI+JSl9yBtYC3tqGWYNxT11dmyxeFNk9y+3wN549nOl7rLTxn1vTSF7v4rA3ei6fhBqKDeuwGdhIOUG3IzIa6+e4VPF9/7e60PP8QDMYgcMnWwtX5Q2FCLNnTI1LNL85hhMxtjXGdWXxzftH6Xa0+zFX2Gd5+rsBcNPEBUUSx1D8Stn5qt9uAZ09el8hK3o1ulx8JZht0g9d7SzqSz6mJ7PMtQbitq8DHXPt1tNVnV5y2b7H+maKpzCSulo8SeQSKzj+IoGcXTGXwUbIKNFCI34YCgIwFNfFsZ7vJBZjvWSoillFdfVRupU41iTD1IaljAOavmFObAdPMDTLdNTKuorc3B5y51MenVhgAMzsgP+TYGlbRq0lRmAWmIjUojLCGdbMlpps1P9bYqLbB8K08r00aqrMoaow3p5nSLHUyN1g7pSnm38Wspv278ScqfGv+U/tt+8dl+RYMpMHLueWJZQ53cKWFn0sJdfdwncc+G6EgfmQzJAotIVbs6icwWFX+Rr5VeHFUm+Vkj9Wrw5siQNGS7I6N2eVdizLr1ml9LurN+rusTvxs9Sa5nb3iqn/xt9Cl5mv3Lzyj0ECwFEqCHPhbf+enDNMao3xJpggF8+PeUoz6/zrS2VnrTWQFIgnf0RHzK/85g1aUe/m+wC+/e9M39ObJDNZkze8O2sWKWzDYV14Fszcq5wQupnNvNbVd8WAENpYoKOwjfqcs3wtViDgQQT0HWBwPGCW0JHKcksss4Y4mMn9HHBbqy8J4jxvIXESxiMStZyhxmMZscZHiShReoDiaQQEI2kemLZISrkYMeIy11ZLAA3yiOhcr8l4cxn/koT5Yo9ZDQFUIXFMv0WLX4Q926cVg0lYx4tIC5QgsjHhnK4AO5rdipFHPDxnRyRVZAZsh0C5Ltnl7NMuawUCx2RpnMb7Gs5VoWsWBzEXuUJqdEkZ5w58HMR4spy2I2XSxtyzkauRof6k8Iw7mDqNFvNtDMbH6XJF7T9peQ80UBAcgEJiArxIVQkKzAAshyeIAsm5HL0C6AkEtQxgJt0Rgty1FhDBEaAySyD8tev7Zb26ltx1vCwZGgLuRFw0wasu4vr0iZc121FddDLC8k57JObYFWrYKyrSclDgDNoxg5F1glyVjpuQIsTdmLFoKk/DLxh8XkLl88euBG/xDW2D3tZPClY6XpJRWW4mcAnengGhgcgyBY/xsiK4E4WOz//t6jf9dAAn5Z/CT8SPDd/q0NvhK+wOdlnyQGYP9opuYjAZFUUT68p+ZDMGi9s3hbzUNvCW9Kes3i1Qmv6CXgBTyHZ/AUnmgeWzx6KMgjLcxpHmyRoAdauH9PnvsWpNy9UcJdXf8dTvp57vThIYLp3L7lkNsyoZs+uLnsRjUPcRbX62jouptrVzm5pnC1lxUiHLryKv2Ks8scly62oUuEixdSEGNK5FMuqAbPy1Ml2IHyDJwjnNWCqQpHJsIZJ/8j9BC6u0JRt0XXATESLXR2iFBnMHS0MxFZ0N7GQBa0naYhApsNTlXz0CnCScIJLhxnwTHCUYEj/R/mwyEhGHlw8IAYHbRozaBVHAjhGUILa1rWwH7CPgXsteYewm7YZe6kwg779m2OaDsBU1xF2bpFgrbG2RYsQ9iMzJstNtXR0CYn2EjYsL4NbSCsN6QgYIrlUwyVcnS2gkE0zYSmRn/URLAhNCxVDRLVINSrqpcBh1D7oa1WDTUZ1TjN6iocEUgCKuVQQSgXWm8DrLDAbJ9GeaYbN1APTQe0P2hutdorQokpKJ8pk9R0l+ziWxj8E95oOr5Hxd9xrsbJ0a+bZX6TLMZOB81UbwrIOonFIwFi5AjZsOu0VKQjIGIqSlYmFb0hYC1kpHNRRgOkk5ioTEAaFVIJKSKSm5TMfWYmidFMQtKG4JC4TGMxQ9j0AaoGpxOmEaZKYAoHJk8SoskWkz4jK5g4oQUT+YTxCAKrh3ESSFBzUAIX1PEdZAvi4xwRAccg1iIm+gXEIGIQZREZsahIBkAL4WFyFG4RRmKiUguqsQykIowd44iIANPB6FF0NJoHOhiphVCCkgMjKGU4G4YNFaFhchg6hIOAKdZNWVLp6EzCkHxKSDANhbAKUVEGLQQF7kJBhEASEyEDBNDAnw1+vqHIz8KXK0d0T+CjBW8teBE8ueDBZyIPCShkIJeAu5solY874/AMwBWjx9XChQEuKoqMA1IqSCTg7CREznJwYrCRYMp0koRNqyliOoiEaiRaA0ISE6E/EBD4TOBx5Yhnwe0geoGjBTbaWARm02QS8BjDEUcMdtbaTdHl4JhPofdT6RagBYMDlY4ceOCQT8H/AwBVRbEnwI4AWwJsEBXZEICogFQUigVAC2QSE5EJIGFFSEzACqSTJO2f5SSf5g8F83HyzgAAAA=='

/** Font data URL for embedding in SVG */
const OVERLAY_FONT_DATA_URL = `data:font/woff2;base64,${OVERLAY_FONT_BASE64}`

/** Default overlay size in pixels (matches DECK_LAYOUT_CONFIG.overlay.size) */
const DEFAULT_OVERLAY_SIZE = 110

/**
 * Generate an SVG string for a quantity overlay badge.
 *
 * The font is embedded inline as a data URL so that rendering is consistent
 * across all environments, including Netlify serverless functions where
 * system fonts may not be available.
 *
 * @param count - The quantity to display (e.g. 2, 3, ... 100)
 * @param size - The width/height of the overlay in pixels
 * @returns SVG string
 */
export function generateOverlaySvg(count: number, size: number): string {
    if (count < 1 || !Number.isInteger(count)) {
        throw new Error(
            `generateOverlaySvg: count must be a positive integer, got ${count}`
        )
    }
    if (size <= 0) {
        throw new Error(
            `generateOverlaySvg: size must be a positive number, got ${size}`
        )
    }

    const scale = size / DEFAULT_OVERLAY_SIZE

    const fontSize =
        count > 99
            ? Math.floor(40 * scale)
            : count > 9
              ? Math.floor(52 * scale)
              : Math.floor(64 * scale)

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>
      @font-face {
        font-family: 'OverlayFont';
        src: url('${OVERLAY_FONT_DATA_URL}') format('woff2');
        font-weight: bold;
      }
    </style>
  </defs>
  <rect width="100%" height="100%" rx="5%" fill="#000000" stroke="#474747ff" stroke-width="2"/>
  <text x="50%" y="50%"
        fill="#FFFFFF"
        font-size="${fontSize}"
        font-family="OverlayFont, DejaVu Sans, Arial, sans-serif"
        font-weight="bold"
        text-anchor="middle"
        dominant-baseline="middle">x${count}</text>
</svg>`
}

/**
 * Convert an SVG string to a PNG Buffer using Sharp.
 *
 * @param svg - SVG markup string
 * @returns PNG image buffer
 */
export async function svgToBuffer(svg: string): Promise<Buffer> {
    return sharp(Buffer.from(svg)).png().toBuffer()
}

/**
 * Generate an SVG quantity overlay and return it as a PNG Buffer.
 * Combines generateOverlaySvg and svgToBuffer for convenience.
 *
 * @param count - The quantity to display
 * @param size - The width/height of the overlay in pixels
 * @returns PNG image buffer
 */
export async function generateOverlayBuffer(
    count: number,
    size: number
): Promise<Buffer> {
    const svg = generateOverlaySvg(count, size)
    return svgToBuffer(svg)
}
