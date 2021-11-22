const BASE_URL = 'https://api.harvardartmuseums.org';
const KEY = 'apikey=3188c073-9150-4763-8482-9b9cec81fbbf'; // USE YOUR KEY HERE


async function fetchObjects() {
    const url = `${ BASE_URL }/object?${ KEY }`;

    onFetchStart()

    try {

        let result = await fetch(url)
        let data = await result.json()

        return data
    } catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }
    

}

fetchObjects();

async function fetchAllCenturies() {
    const url = `${ BASE_URL }/century?${ KEY }&size=100&sort=temporalorder`

    if (localStorage.getItem('centuries')) {
        return JSON.parse(localStorage.getItem('centuries'))
    }

    onFetchStart()

    try {

        const result = await fetch(url)
        const data = await result.json()
        const records = data.records

        localStorage.setItem('centuries', JSON.stringify(records))

        return records

    } catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }

}

async function fetchAllClassifications() {
    const url = `${ BASE_URL }/classification?${ KEY }&size=100&sort=name`

    if (localStorage.getItem('classifications')) {
        return JSON.parse(localStorage.getItem('classifications'))
    }

    onFetchStart()

    try {

        const result = await fetch(url)
        const data = await result.json()
        const records = data.records

        localStorage.setItem('classifications', JSON.stringify(records))

        return records
    } catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }
}


async function prefetchCategoryLists() {

    try {

      const [ classifications, centuries ] = await Promise.all([ fetchAllClassifications(), fetchAllCenturies() ]);


      $('.classification-count').text(`(${ classifications.length })`)

      classifications.forEach(classification => {
        $('#select-classification').append($(`<option value="${classification.name}">${classification.name}</option>`))
      })

      $('.century-count').text(`(${ centuries.length })`)

      centuries.forEach(century => {
        $('#select-century').append($(`<option value="${century.name}">${century.name}</option>`))
      })

    } catch (error) {
      console.error(error);
    }
}

prefetchCategoryLists()


async function buildSearchString() {

    const classification = $('#select-classification').val()
    const century = $('#select-century').val()
    const keyword = $('#keywords').val()


    const url = `${ BASE_URL }/object?${ KEY }&classification=${ classification }&century=${ century }&keywords=${ keyword }`
    //console.log(url)

    const encodedUrl = encodeURI(url)
    return encodedUrl

}

$('#search').on('submit', async function (event) {
    event.preventDefault()

    onFetchStart()

    try{
        let url = await buildSearchString()
        let result = await fetch(url)
        let data = await result.json()

        //console.log('info', data.info, 'records', data.records)
        updatePreview(data)

    } catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }

})


function onFetchStart() {
    $('#loading').addClass('active');
}
  
function onFetchEnd() {
    $('#loading').removeClass('active');
}

function renderPreview(record) {
    // grab description, primaryimageurl, and title from the record
    let {description, primaryimageurl, title} = record
    //console.log(record)

    //Template looks like this:

    if (description == null) {
        description = ""
    }

    if (primaryimageurl == null) {
        primaryimageurl = ""
    }

    if (title == null) {
        title = ""
    }

    let element = $(`<div class="object-preview">
                        <a href="${record.url}">
                            <img src="${primaryimageurl}" />
                            <h3>${title}</h3>
                        </a>
                    </div>`)

    //console.log('record.url', record.url)
  
    //Some of the items might be undefined, if so... don't render them
    
  
    //With the record attached as data, with key 'record'
    element.data('record', record)
  
    // return new element
    return element
}
  
  
function updatePreview(records) {
    const root = $('#preview');

    /*
    if info.next is present:
      - on the .next button set data with key url equal to info.next
      - also update the disabled attribute to false
    else
      - set the data url to null
      - update the disabled attribute to true


    Do the same for info.prev, with the .previous button
    */

    if (records.info.next) {
        $('.next').data('url', records.info.next)
        $('.next').attr('disabled', false)
    } else {
        $('.next').data('url', null)
        $('.next').attr('disabled', true)
    }
    
    if (records.info.prev) {
        $('.previous').data('url', records.info.prev)
        $('.previous').attr('disabled', false)
    } else {
        $('.previous').data('url', null)
        $('.previous').attr('disabled', true)
    }

    // grab the results element, it matches .results inside root
    const results = $(root).find('.results')
    // empty it
    results.empty()
    // loop over the records, and append the renderPreview
    records.records.forEach(record => {
        results.append(renderPreview(record))
    })
}

$('#preview .next, #preview .previous').on('click', async function () {

    const root = $('#preview')

    /*
      read off url from the target 
      fetch the url
      read the records and info from the response.json()
      update the preview
    */

    onFetchStart()
    try {

        //const results = $(root).find('.results')
        //results.empty()

        const url = await $(this).data('url')
        const response = await fetch(url)
        const data = await response.json()

        //console.log('records', records, 'info', info)

        updatePreview(data)

    } catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }
})


$('#preview').on('click', '.object-preview', function (event) {
    event.preventDefault(); // they're anchor tags, so don't follow the link

    const previewObj = $(this).closest('.object-preview')
    // find the '.object-preview' element by using .closest() from the target
    let previewRecord = previewObj.data('record')
    // recover the record from the element using the .data('record') we attached
    //console.log(previewRecord)
    // log out the record object to see the shape of the data
    $('#feature').html(renderFeature(previewRecord))
    // NEW => set the html() on the '#feature' element to renderFeature()
})

function renderFeature(record) {
    /**
     * We need to read, from record, the following:
     * HEADER: title, dated
     * FACTS: description, culture, style, technique, medium, dimensions, people, department, division, contact, creditline
     * PHOTOS: images, primaryimageurl
    */

    const {title, dated, description, culture, style, technique, medium} = record
    const {dimensions, people, department, division, contact, creditline} = record

    //console.log('HERE', culture, typeof(culture))
    // build and return template
    let featureElement = $(`<div class="object-feature">
                <header>
                    <h3>${title}</h3>
                    <h4>${dated}</h4>
                </header>
                <section class="facts">

                    ${ factHTML("Description", description)}

                    ${ factHTML("Culture", culture, 'culture')}

                    ${ factHTML("Style", style)}

                    ${ factHTML("Technique", technique, 'technique')}

                    ${ factHTML("Medium", medium, 'medium')}

                    ${ factHTML("Dimensions", dimensions)}

                    ${ people ? people.map(person => {
                        return factHTML('Person', person.displayname, 'person')
                    }).join('') : ''
                    }

                    ${ factHTML("Department", department)}

                    ${ factHTML("Division", division)}

                    ${ factHTML('Contact', `<a target="_blank" href="mailto:${ contact }">${ contact }</a>`) }

                    ${ factHTML("Creditline", creditline)}



                </section>
                <section class="photos">
                  ${ photosHTML(record.images, record.primaryimageurl) }
                </section>
              </div>`);
    return featureElement
}

function searchURL(searchType, searchString) {
    return `${ BASE_URL }/object?${ KEY }&${ searchType}=${ searchString }`;
}
  
function factHTML(title, content, searchTerm = null) {
    // if content is empty or undefined, return an empty string ''
    if (content == null || content == undefined || content === '') {
        return ''
    }
    //if (content == undefined) {
    //    return ''
    //}
  
    // otherwise, if there is no searchTerm, return the two spans
    if (searchTerm === null) {
        let factElement = `<span class="title">${title}</span>
                            <span class="content">${content}</span>`
        
        return factElement
    }
  
    // otherwise, return the two spans, with the content wrapped in an anchor tag
    if(searchTerm) {
        let factElement = `<span class="title">${title}</span>
        <span class="content"><a href="${searchURL(searchTerm, content)}">${content}</a></span>`
        return factElement
    }
}


function photosHTML(images, primaryimageurl) {
    //console.log(images)
    if(images == true && images.length > 0) {
        return images.map(image => {
            `<img src="${image.baseimageurl}" alt="Image">`
        }).join()
    } else if (primaryimageurl) {
        return `<img src="${primaryimageurl}" alt="Primary Image">`
    } else {
        return ''
    }
}

$('#feature').on('click', 'a', async function (event) {
    // read href off of $(this) with the .attr() method
    const root = $('#preview')
    const link = $(this).attr('href')

    // prevent default
    if(link.startsWith('mailto')) {
        return;
    }
    event.preventDefault()

    // call onFetchStart
    onFetchStart()
    
    // fetch the href
    try {

        let fetchResponse = await fetch(link)
        let data = await fetchResponse.json()
        let records = data.records

        const results = $(root).find('.results')
        results.empty()
        records.forEach(record => {
            results.append(renderPreview(record))
        })
    }catch (error) {
        console.error(error)
    } finally {
        onFetchEnd()
    }
    // render it into the preview
    // call onFetchEnd
});