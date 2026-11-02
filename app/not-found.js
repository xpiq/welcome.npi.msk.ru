const notFound = () => {
  return (
    <section className="section">
      <div className="container">
        <div className="flex h-[40vh] items-center justify-center text-center">
          <div>
            <h1 className="mb-4">Страница не найдена</h1>
            <p>Запрошенная страница недоступна.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default notFound;
