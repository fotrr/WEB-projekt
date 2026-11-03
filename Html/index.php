<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <title>ROOTSINVEIN</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="../CSS/ind3x.css">
    <link rel="icon" type="image/png" sizes="16x16" href="../IMG/favicon-16x16.png">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js" defer></script>
    <script src="../JS/index.js" defer></script>
</head>
<body>

<canvas id="ocean" aria-hidden="true"></canvas>

<div class="container py-4">

    <nav class="navbar navbar-expand-sm navbar-dark glass glass-nav rounded-pill px-3 py-2 mb-4">
        <div class="container-fluid">
            <a class="navbar-brand" href="index.html">
                <img src="../IMG/favicon.ico" alt="ROOTSINVEIN" width="44" height="44">
            </a>
            <button class="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#mynavbar" aria-label="Menu">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="mynavbar">
                <ul class="navbar-nav me-auto gap-sm-1">
                    <li class="nav-item"><a class="nav-link active" href="javascript:void(0)">Ostrov</a></li>
                    <li class="nav-item"><a class="nav-link" href="javascript:void(0)">Rott</a></li>
                    <li class="nav-item"><a class="nav-link" href="javascript:void(0)">Link</a></li>
                </ul>
            </div>
        </div>
    </nav>

    <!-- Obsah -->
    <main class="row g-4">
        <section class="col-lg-8">
            <article class="glass glass-card hero rounded-5 p-4 p-md-5 h-100">
                <h1 class="display-4 fw-bold">Vsechno je jedno</h1>
                <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut eu elit porta, pharetra lacus non, condimentum risus. Sed feugiat risus non tempus vulputate. Curabitur porttitor ligula quis tellus porttitor, at dapibus libero molestie. Duis ut risus ut mi volutpat pretium vitae eu turpis. Morbi congue vehicula condimentum. Curabitur euismod mi ornare arcu pellentesque tempor. Suspendisse aliquam eu velit et imperdiet. In hendrerit libero ac quam sodales semper. Aliquam erat volutpat. Nullam iaculis odio sit amet ante hendrerit, sit amet porta magna faucibus. Vestibulum cursus massa sit amet nisi tincidunt, quis pellentesque dolor tincidunt. Mauris vestibulum vel turpis non tincidunt. Cras laoreet, libero a tempus placerat, felis lectus tempus ex, vel laoreet lacus tortor in libero. Mauris id turpis dapibus, laoreet eros at, ultricies dui. Morbi urna urna, venenatis vel porttitor vitae, pellentesque sit amet lacus. Phasellus quis orci id sapien efficitur scelerisque.</p>
                <a href="javascript:void(0)" class="btn btn-glass rounded-pill px-4 mt-2">Zjistit více</a>
            </article>
        </section>

        <aside class="col-lg-4">
            <article class="glass glass-card rounded-5 p-4 p-md-5 h-100">
                <h2 class="fw-bold">Bleh</h2>
                <p>Donec vitae vestibulum dolor, in consequat eros. Quisque eu fringilla eros. Suspendisse porta ligula risus. Duis ipsum quam, facilisis vitae lectus eget, vulputate suscipit nunc. Aenean scelerisque, risus eget cursus aliquet, metus dui aliquet nibh, non elementum nisi felis a lectus. In eget nulla non dolor facilisis viverra id eu dolor. Donec rutrum dui tellus, nec fermentum leo rutrum non. Integer ac libero nec risus aliquet dignissim. Maecenas interdum dui a ante varius aliquet.</p>
            </article>
        </aside>
    </main>

</div>

</body>
</html>
